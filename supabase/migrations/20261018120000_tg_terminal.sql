-- 18.10.2026, его слово «Все, давай внедряй»: терминал внутри Телеграма, два вида.
--   echo   — бот Echo-Gate (подписчики): Инструмент · Скринер · ТОП-лист · Решения; только у кого действует подписка бота;
--   school — школьный бот (холодные): Решения (старше суток, как в пробе) · Инструмент (инструменты пробы) ·
--            Машина времени · Тренажёр; пускает любого, кто открыл из бота.
-- Кто открыл — проверяет база: Телеграм подписывает initData ключом бота, функция tg_terminal сверяет подпись
-- (HMAC-SHA256, документация Telegram Web Apps). Ключи ботов кладёт мост с VPS (terminal_publish.py), в коде и в
-- переписке их нет: в tg_secret хранится не сам токен, а производный ключ HMAC("WebAppData", токен).
-- Картинки бота — копия в открытом ящике tgpub под случайной папкой, папку мост меняет каждый круг (tg_pub_token).

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.tg_secret (
  bot text PRIMARY KEY,
  secret text NOT NULL,            -- hex производного ключа
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tg_secret ENABLE ROW LEVEL SECURITY;   -- правил нет: читает только функция ниже и мост

CREATE TABLE IF NOT EXISTS public.tg_access (
  tg_id bigint PRIMARY KEY,
  expires date NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tg_access ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.tg_pub_token (
  id int PRIMARY KEY DEFAULT 1,
  token text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tg_pub_token ENABLE ROW LEVEL SECURITY;

INSERT INTO storage.buckets (id, name, public)
VALUES ('tgpub', 'tgpub', true)
ON CONFLICT (id) DO NOTHING;

-- %XX и «+» → текст (так кодирует Телеграм значения initData)
CREATE OR REPLACE FUNCTION public._tg_url_decode(s text)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  b bytea := ''::bytea;
  i int := 1;
  n int := length(s);
  c text;
BEGIN
  WHILE i <= n LOOP
    c := substr(s, i, 1);
    IF c = '%' AND i + 2 <= n THEN
      b := b || decode(substr(s, i + 1, 2), 'hex');
      i := i + 3;
    ELSIF c = '+' THEN
      b := b || convert_to(' ', 'UTF8');
      i := i + 1;
    ELSE
      b := b || convert_to(c, 'UTF8');
      i := i + 1;
    END IF;
  END LOOP;
  RETURN convert_from(b, 'UTF8');
END $$;

CREATE OR REPLACE FUNCTION public.tg_terminal(init_data text, bot text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  sec bytea;
  kv text;
  k text;
  v text;
  got_hash text;
  parts text[] := '{}';
  dcs text;
  calc text;
  auth_ts bigint;
  usr jsonb;
  uid bigint;
  res jsonb;
  vitems jsonb := '[]'::jsonb;
  item jsonb;
  t timestamptz;
BEGIN
  IF bot NOT IN ('echo', 'school') THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'bot');
  END IF;
  SELECT decode(s.secret, 'hex') INTO sec FROM public.tg_secret s WHERE s.bot = tg_terminal.bot;
  IF sec IS NULL OR coalesce(init_data, '') = '' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_init');
  END IF;
  FOREACH kv IN ARRAY string_to_array(init_data, '&') LOOP
    k := split_part(kv, '=', 1);
    v := public._tg_url_decode(substr(kv, length(k) + 2));
    IF k = 'hash' THEN
      got_hash := v;
    ELSE
      parts := parts || (k || '=' || v);
      IF k = 'auth_date' THEN auth_ts := v::bigint; END IF;
      IF k = 'user' THEN usr := v::jsonb; END IF;
    END IF;
  END LOOP;
  -- строки «ключ=значение», отсортированные по ключу (документация Telegram Web Apps)
  SELECT string_agg(p, E'\n' ORDER BY split_part(p, '=', 1) COLLATE "C") INTO dcs FROM unnest(parts) AS p;
  calc := encode(hmac(convert_to(dcs, 'UTF8'), sec, 'sha256'), 'hex');
  IF got_hash IS NULL OR calc <> lower(got_hash) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'sign');
  END IF;
  IF auth_ts IS NULL OR extract(epoch FROM now()) - auth_ts > 86400 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'old');
  END IF;
  uid := (usr ->> 'id')::bigint;

  IF bot = 'echo' THEN
    IF NOT EXISTS (SELECT 1 FROM public.tg_access a WHERE a.tg_id = uid AND a.expires >= current_date) THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'no_access', 'user', usr);
    END IF;
    SELECT jsonb_build_object(
      'ok', true, 'bot', bot, 'user', usr,
      'pub', (SELECT token FROM public.tg_pub_token WHERE id = 1),
      'meta', (SELECT to_jsonb(m) FROM public.market_meta m LIMIT 1),
      'rows', coalesce((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.sort_order, r.symbol) FROM public.market_snapshot r), '[]'::jsonb),
      'feeds', coalesce((SELECT jsonb_object_agg(f.key, f.data) FROM public.market_feed f
                         WHERE f.key IN ('screener', 'verdicts', 'outcomes')), '{}'::jsonb),
      'videos', (SELECT value FROM public.site_settings WHERE key = 'terminal_journal_videos'))
    INTO res;
    RETURN res;
  END IF;

  -- school: решения — только старше суток, как в пробном режиме кабинета
  FOR item IN SELECT * FROM jsonb_array_elements(coalesce(
      (SELECT data -> 'items' FROM public.market_feed WHERE key = 'verdicts'), '[]'::jsonb)) LOOP
    BEGIN
      t := (item ->> 'time')::timestamptz;
    EXCEPTION WHEN others THEN
      t := NULL;
    END;
    IF t IS NOT NULL AND t <= now() - interval '24 hours' THEN
      vitems := vitems || jsonb_build_array(item);
    END IF;
  END LOOP;
  SELECT jsonb_build_object(
    'ok', true, 'bot', bot, 'user', usr,
    'pub', (SELECT token FROM public.tg_pub_token WHERE id = 1),
    'meta', (SELECT to_jsonb(m) FROM public.market_meta m LIMIT 1),
    'rows', coalesce((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.sort_order, r.symbol) FROM public.market_snapshot r
                      WHERE r.symbol = ANY (public.terminal_trial_symbols())),   -- те же, что открыты в пробе
                     '[]'::jsonb),
    'feeds', jsonb_build_object(
      'verdicts', jsonb_build_object('items', vitems),
      'outcomes', (SELECT data FROM public.market_feed WHERE key = 'outcomes'),
      'timemachine', (SELECT data FROM public.market_feed WHERE key = 'timemachine')),
    'videos', (SELECT value FROM public.site_settings WHERE key = 'terminal_journal_videos'))
  INTO res;
  RETURN res;
END $$;

REVOKE EXECUTE ON FUNCTION public.tg_terminal(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tg_terminal(text, text) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._tg_url_decode(text) FROM PUBLIC, anon, authenticated;
