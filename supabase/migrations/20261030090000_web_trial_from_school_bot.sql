-- 30.10.2026, его «да, делай»: полная версия терминала на компьютере для тех, кто на пробе в школьном боте.
--
-- 1. Проба кабинета = весь терминал, как у подписчика: замки 07.10.2026 (3 инструмента, журнал с задержкой, скринер
--    и ТОП-лист под замком) сняты. Бот экосистемы — отдельный доступ (tg_access), проба кабинета его не даёт.
-- 2. Сама по себе проба в кабинете не открывается (с 19.10.2026 регистрация её не выдаёт). Её открывает только личная
--    ссылка из школьного бота, то есть после 4 вопросов:
--      https://www.tradeliketyo.com/school/full?t=<tg_id>.<exp>.<подпись>
--    exp — конец 7 дней пробы в боте (unix-секунды, тот же, что в пропуске терминала), подпись =
--    hex(HMAC-SHA256("web:<tg_id>:<exp>", ключ школьного бота из tg_secret)). Ключ тот же, что у пропуска терминала
--    в Телеграме, начало строки другое («web:», а не «school:»), чтобы пропуск Телеграма не открывал кабинет.
--    Один человек в боте — один аккаунт: ссылку, пересланную другу, второй аккаунт не примет.

-- 1. Полный доступ: любой действующий доступ (подписка или проба) или админ
CREATE OR REPLACE FUNCTION public.has_full_terminal_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT _user_id IS NOT NULL
     AND _user_id = auth.uid()
     AND (
       EXISTS (SELECT 1 FROM public.terminal_access
                WHERE user_id = _user_id AND expires_at > now())
       OR public.has_role(_user_id, 'admin')
     );
$$;

-- 2. Кто по какой ссылке открыл пробу
CREATE TABLE IF NOT EXISTS public.web_trial_claims (
  tg_id      bigint PRIMARY KEY,
  user_id    uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.web_trial_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "web_trial_claims_admin_select" ON public.web_trial_claims;
CREATE POLICY "web_trial_claims_admin_select"
  ON public.web_trial_claims FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Открыть пробу по ссылке из бота — для вошедшего аккаунта
CREATE OR REPLACE FUNCTION public.claim_web_trial(t text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  me    uuid := auth.uid();
  sec   bytea;
  p_uid text := split_part(coalesce(t, ''), '.', 1);
  p_exp text := split_part(coalesce(t, ''), '.', 2);
  p_sig text := split_part(coalesce(t, ''), '.', 3);
  t_until timestamptz;
  holder uuid;
  acc   public.terminal_access;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'auth');
  END IF;
  SELECT decode(s.secret, 'hex') INTO sec FROM public.tg_secret s WHERE s.bot = 'school';
  IF sec IS NULL OR p_uid !~ '^[0-9]{1,20}$' OR p_exp !~ '^[0-9]{1,12}$'
     OR encode(hmac(convert_to('web:' || p_uid || ':' || p_exp, 'UTF8'), sec, 'sha256'), 'hex') <> lower(p_sig) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bad');
  END IF;

  t_until := to_timestamp(p_exp::bigint);
  IF t_until <= now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'expired', 'until', t_until);
  END IF;
  -- проба в боте — 7 дней; дальше в будущее подпись не выдаётся
  IF t_until > now() + interval '8 days' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bad');
  END IF;

  SELECT c.user_id INTO holder FROM public.web_trial_claims c WHERE c.tg_id = p_uid::bigint;
  IF holder IS NOT NULL AND holder <> me THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'used');
  END IF;
  IF holder IS NULL AND EXISTS (SELECT 1 FROM public.web_trial_claims c WHERE c.user_id = me) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'used');
  END IF;

  -- действующую подписку проба не трогает
  SELECT * INTO acc FROM public.terminal_access a WHERE a.user_id = me;
  IF FOUND AND NOT acc.is_trial AND acc.expires_at > now() THEN
    RETURN jsonb_build_object('ok', true, 'subscriber', true, 'until', acc.expires_at);
  END IF;

  INSERT INTO public.web_trial_claims (tg_id, user_id, expires_at)
  VALUES (p_uid::bigint, me, t_until)
  ON CONFLICT (tg_id) DO UPDATE SET expires_at = EXCLUDED.expires_at;

  INSERT INTO public.terminal_access (user_id, expires_at, is_trial, note)
  VALUES (me, t_until, true, 'проба по ссылке школьного бота')
  ON CONFLICT (user_id) DO UPDATE
    SET expires_at = EXCLUDED.expires_at, is_trial = true, note = EXCLUDED.note;

  RETURN jsonb_build_object('ok', true, 'until', t_until);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_web_trial(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_web_trial(text) TO authenticated;
