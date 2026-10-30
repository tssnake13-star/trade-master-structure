-- 30.10.2026, его слова: «на сайте надо, чтобы они оставляли свой телеграм при регистрации… почта как резерв, нужен именно
-- Telegram» и «не теряя лидов в базе». Путь: регистрация на сайте → «Подключите Telegram» (t.me/…?start=web_<код>) → бот
-- связывает аккаунт с человеком и задаёт обычные 4 вопроса → прошёл: те же 7 дней открываются и в боте, и в кабинете.
-- Вопросы только в боте: правила отсева, карточка Сергею и напоминания одни на всех. Без Telegram терминал не открывается,
-- почта остаётся в базе, через 30 минут бот шлёт Сергею карточку «зарегистрировался, Telegram не подключил».
-- Функции bot_* вызывает бот открытым ключом; право им даёт подпись ключом школьного бота (tg_secret), как у пропуска терминала.

-- 1. Кто из аккаунтов сайта к какому Telegram подключён
CREATE TABLE IF NOT EXISTS public.site_leads (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tg_id       bigint UNIQUE,
  linked_at   timestamptz,
  notified_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_leads_select" ON public.site_leads;
CREATE POLICY "site_leads_select"
  ON public.site_leads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 2. Одноразовые коды кнопки «Подключить Telegram»
CREATE TABLE IF NOT EXISTS public.tg_link_codes (
  code       text PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at    timestamptz,
  used_by    bigint
);

ALTER TABLE public.tg_link_codes ENABLE ROW LEVEL SECURITY;

-- 3. Открыть пробу аккаунту: оплаченный доступ не трогаем, из двух сроков пробы — поздний
CREATE OR REPLACE FUNCTION public.grant_site_trial(_user uuid, _until timestamptz, _note text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  acc public.terminal_access;
BEGIN
  SELECT * INTO acc FROM public.terminal_access a WHERE a.user_id = _user;
  IF FOUND AND NOT acc.is_trial AND acc.expires_at > now() THEN
    RETURN;
  END IF;
  INSERT INTO public.terminal_access (user_id, expires_at, is_trial, note)
  VALUES (_user, _until, true, _note)
  ON CONFLICT (user_id) DO UPDATE
    SET expires_at = CASE WHEN public.terminal_access.is_trial
                          THEN greatest(public.terminal_access.expires_at, EXCLUDED.expires_at)
                          ELSE EXCLUDED.expires_at END,
        is_trial = true,
        note = EXCLUDED.note;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.grant_site_trial(uuid, timestamptz, text) FROM PUBLIC, anon, authenticated;

-- 4. Код для кнопки: вошедшему, сутки; перезагрузка страницы даёт тот же код
CREATE OR REPLACE FUNCTION public.make_tg_link_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  me uuid := auth.uid();
  c  text;
BEGIN
  IF me IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT l.code INTO c FROM public.tg_link_codes l
   WHERE l.user_id = me AND l.used_at IS NULL AND l.created_at > now() - interval '1 day'
   ORDER BY l.created_at DESC LIMIT 1;
  IF c IS NULL THEN
    c := encode(gen_random_bytes(12), 'hex');
    INSERT INTO public.tg_link_codes (code, user_id) VALUES (c, me);
  END IF;
  RETURN c;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.make_tg_link_code() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.make_tg_link_code() TO authenticated;

-- 5. Бот: человек нажал «Старт» по ссылке web_<код>. _until — конец его пробы в боте (0, если её нет)
CREATE OR REPLACE FUNCTION public.bot_link_account(_code text, _tg_id bigint, _until bigint, _ts bigint, _sig text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  sec  bytea;
  c    public.tg_link_codes;
  prev uuid;
  em   text;
  nm   text;
  src  text;
BEGIN
  SELECT decode(s.secret, 'hex') INTO sec FROM public.tg_secret s WHERE s.bot = 'school';
  IF sec IS NULL OR abs(extract(epoch FROM now()) - _ts) > 600
     OR encode(hmac(convert_to('link:' || _code || ':' || _tg_id || ':' || _until || ':' || _ts, 'UTF8'), sec, 'sha256'), 'hex') <> lower(coalesce(_sig, '')) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bad');
  END IF;

  SELECT * INTO c FROM public.tg_link_codes l WHERE l.code = _code;
  IF NOT FOUND OR (c.used_at IS NOT NULL AND c.used_by IS DISTINCT FROM _tg_id)
     OR (c.used_at IS NULL AND c.created_at < now() - interval '1 day') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'code');
  END IF;

  SELECT l.user_id INTO prev FROM public.site_leads l WHERE l.tg_id = _tg_id;
  IF prev IS NOT NULL AND prev <> c.user_id THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'tg_other');
  END IF;
  IF EXISTS (SELECT 1 FROM public.site_leads l WHERE l.user_id = c.user_id AND l.tg_id IS NOT NULL AND l.tg_id <> _tg_id) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'acc_other');
  END IF;

  UPDATE public.tg_link_codes SET used_at = coalesce(used_at, now()), used_by = _tg_id WHERE code = _code;
  INSERT INTO public.site_leads (user_id, tg_id, linked_at) VALUES (c.user_id, _tg_id, now())
  ON CONFLICT (user_id) DO UPDATE SET tg_id = EXCLUDED.tg_id, linked_at = coalesce(public.site_leads.linked_at, EXCLUDED.linked_at);

  IF _until > extract(epoch FROM now()) THEN
    PERFORM public.grant_site_trial(c.user_id, to_timestamp(_until), 'проба школьного бота, Telegram подключён с сайта');
  END IF;

  SELECT p.email, p.full_name INTO em, nm FROM public.profiles p WHERE p.user_id = c.user_id;
  SELECT u.raw_user_meta_data ->> 'source' INTO src FROM auth.users u WHERE u.id = c.user_id;
  RETURN jsonb_build_object('ok', true, 'email', em, 'name', nm, 'source', src);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bot_link_account(text, bigint, bigint, bigint, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bot_link_account(text, bigint, bigint, bigint, text) TO anon, authenticated;

-- 6. Бот: человек прошёл вопросы (или получил повторные 7 дней) — тот же срок в кабинете, если Telegram подключён
CREATE OR REPLACE FUNCTION public.bot_trial_sync(_tg_id bigint, _until bigint, _ts bigint, _sig text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  sec bytea;
  acc uuid;
BEGIN
  SELECT decode(s.secret, 'hex') INTO sec FROM public.tg_secret s WHERE s.bot = 'school';
  IF sec IS NULL OR abs(extract(epoch FROM now()) - _ts) > 600
     OR encode(hmac(convert_to('trial:' || _tg_id || ':' || _until || ':' || _ts, 'UTF8'), sec, 'sha256'), 'hex') <> lower(coalesce(_sig, '')) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bad');
  END IF;
  SELECT l.user_id INTO acc FROM public.site_leads l WHERE l.tg_id = _tg_id;
  IF acc IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'linked', false);
  END IF;
  IF _until > extract(epoch FROM now()) THEN
    PERFORM public.grant_site_trial(acc, to_timestamp(_until), 'проба школьного бота, Telegram подключён с сайта');
  END IF;
  RETURN jsonb_build_object('ok', true, 'linked', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bot_trial_sync(bigint, bigint, bigint, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bot_trial_sync(bigint, bigint, bigint, text) TO anon, authenticated;

-- 7. Бот: кто зарегистрировался на сайте и за 30 минут не подключил Telegram. _ack — кому карточка уже ушла.
--    Старых аккаунтов не трогаем: только зарегистрированные после запуска
CREATE OR REPLACE FUNCTION public.bot_site_leads(_ts bigint, _ack uuid[], _sig text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  sec bytea;
  res jsonb;
BEGIN
  SELECT decode(s.secret, 'hex') INTO sec FROM public.tg_secret s WHERE s.bot = 'school';
  IF sec IS NULL OR abs(extract(epoch FROM now()) - _ts) > 600
     OR encode(hmac(convert_to('leads:' || _ts || ':' || coalesce(array_to_string(_ack, ','), ''), 'UTF8'), sec, 'sha256'), 'hex') <> lower(coalesce(_sig, '')) THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.site_leads (user_id, notified_at)
  SELECT a, now() FROM unnest(coalesce(_ack, '{}')) AS a
  ON CONFLICT (user_id) DO UPDATE SET notified_at = now();

  SELECT coalesce(jsonb_agg(x), '[]'::jsonb) INTO res FROM (
    SELECT p.user_id, p.email, p.full_name AS name, p.created_at,
           u.raw_user_meta_data ->> 'source' AS source
      FROM public.profiles p
      JOIN auth.users u ON u.id = p.user_id
      LEFT JOIN public.site_leads l ON l.user_id = p.user_id
     WHERE p.created_at >= timestamptz '2026-10-30 08:00+00'
       AND p.created_at <= now() - interval '30 minutes'
       AND l.tg_id IS NULL AND l.notified_at IS NULL
       AND NOT public.has_role(p.user_id, 'admin')
     ORDER BY p.created_at
     LIMIT 20
  ) x;
  RETURN res;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bot_site_leads(bigint, uuid[], text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bot_site_leads(bigint, uuid[], text) TO anon, authenticated;

-- 8. Кнопка «Полная версия на компьютере» тоже связывает аккаунт с Telegram
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
  -- этот Telegram или этот аккаунт уже связаны с другим через «Подключить Telegram»
  IF EXISTS (SELECT 1 FROM public.site_leads l WHERE l.tg_id = p_uid::bigint AND l.user_id <> me)
     OR EXISTS (SELECT 1 FROM public.site_leads l WHERE l.user_id = me AND l.tg_id IS NOT NULL AND l.tg_id <> p_uid::bigint) THEN
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

  INSERT INTO public.site_leads (user_id, tg_id, linked_at) VALUES (me, p_uid::bigint, now())
  ON CONFLICT (user_id) DO UPDATE SET tg_id = EXCLUDED.tg_id, linked_at = coalesce(public.site_leads.linked_at, EXCLUDED.linked_at);

  INSERT INTO public.terminal_access (user_id, expires_at, is_trial, note)
  VALUES (me, t_until, true, 'проба по ссылке школьного бота')
  ON CONFLICT (user_id) DO UPDATE
    SET expires_at = EXCLUDED.expires_at, is_trial = true, note = EXCLUDED.note;

  RETURN jsonb_build_object('ok', true, 'until', t_until);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_web_trial(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_web_trial(text) TO authenticated;
