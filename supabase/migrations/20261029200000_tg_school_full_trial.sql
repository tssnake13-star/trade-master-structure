-- 29.10.2026, его слово «Да, делай, открой всё на 7 дней»: терминал школьного бота на 7 дней пробы отдаёт то же, что
-- подписчику в боте экосистемы, — все инструменты, скринер с ТОП-листом, решения сразу, без задержки, итоги решений и
-- «Сделки до и после». Было: 3 инструмента пробы (terminal_trial_symbols) и решения старше 3 дней. После 7 дней — как было:
-- навсегда журнал решений старше 3 дней, остальное после подписки. Проверка подписи и пропуска не менялась.

CREATE OR REPLACE FUNCTION public.tg_terminal(init_data text, bot text, pass text DEFAULT NULL)
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
  is_admin boolean := false;
  p_uid text;
  p_exp text;
  p_sig text;
  is_full boolean := true;
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
    -- администратор — его мост пишет со сроком 2099-12-31 (terminal_publish._tg_access)
    is_admin := EXISTS (SELECT 1 FROM public.tg_access a WHERE a.tg_id = uid AND a.expires >= DATE '2099-01-01');
    SELECT jsonb_build_object(
      'ok', true, 'bot', bot, 'user', usr, 'admin', is_admin,
      'pub', (SELECT token FROM public.tg_pub_token WHERE id = 1),
      'meta', (SELECT to_jsonb(m) FROM public.market_meta m LIMIT 1),
      'rows', coalesce((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.sort_order, r.symbol) FROM public.market_snapshot r), '[]'::jsonb),
      'feeds', coalesce((SELECT jsonb_object_agg(f.key, f.data) FROM public.market_feed f
                         WHERE f.key IN ('screener', 'verdicts', 'outcomes')
                            OR (is_admin AND f.key = 'verdicts_crypto')), '{}'::jsonb),
      'videos', (SELECT value FROM public.site_settings WHERE key = 'terminal_journal_videos'))
    INTO res;
    RETURN res;
  END IF;

  -- school: пропуск из кнопки бота «кто.до_когда.подпись» (school_bot.terminal_url) — 7 дней от входа в базу бота;
  -- подпись тем же ключом, что initData (производный от токена школьного бота), человек — тот, кто открыл
  p_uid := split_part(coalesce(pass, ''), '.', 1);
  p_exp := split_part(coalesce(pass, ''), '.', 2);
  p_sig := split_part(coalesce(pass, ''), '.', 3);
  IF p_uid !~ '^[0-9]+$' OR p_exp !~ '^[0-9]+$' OR p_uid <> uid::text
     OR encode(hmac(convert_to('school:' || p_uid || ':' || p_exp, 'UTF8'), sec, 'sha256'), 'hex') <> lower(p_sig) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'school_pass', 'user', usr);
  END IF;
  -- 7 дней прошли — навсегда остаётся журнал решений, остальное после подписки
  is_full := p_exp::bigint >= extract(epoch FROM now());

  -- 29.10.2026: 7 дней пробы — всё, как у подписчика в боте экосистемы, плюс «Сделки до и после» (у подписчика они
  -- в веб-кабинете). Журнал по крипте «только ему» (verdicts_crypto) сюда не идёт, как и подписчику
  IF is_full THEN
    SELECT jsonb_build_object(
      'ok', true, 'bot', bot, 'user', usr, 'limited', false,
      'pub', (SELECT token FROM public.tg_pub_token WHERE id = 1),
      'meta', (SELECT to_jsonb(m) FROM public.market_meta m LIMIT 1),
      'rows', coalesce((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.sort_order, r.symbol) FROM public.market_snapshot r), '[]'::jsonb),
      'feeds', coalesce((SELECT jsonb_object_agg(f.key, f.data) FROM public.market_feed f
                         WHERE f.key IN ('screener', 'verdicts', 'outcomes', 'timemachine')), '{}'::jsonb),
      'videos', (SELECT value FROM public.site_settings WHERE key = 'terminal_journal_videos'))
    INTO res;
    RETURN res;
  END IF;

  -- после пробы: решения — только старше 3 дней, как в пробном режиме кабинета
  FOR item IN SELECT * FROM jsonb_array_elements(coalesce(
      (SELECT data -> 'items' FROM public.market_feed WHERE key = 'verdicts'), '[]'::jsonb)) LOOP
    BEGIN
      t := (item ->> 'time')::timestamptz;
    EXCEPTION WHEN others THEN
      t := NULL;
    END;
    IF t IS NOT NULL AND t <= now() - interval '72 hours' THEN
      vitems := vitems || jsonb_build_array(item);
    END IF;
  END LOOP;
  SELECT jsonb_build_object(
    'ok', true, 'bot', bot, 'user', usr, 'limited', true,
    'pub', (SELECT token FROM public.tg_pub_token WHERE id = 1),
    'meta', (SELECT to_jsonb(m) FROM public.market_meta m LIMIT 1),
    'rows', '[]'::jsonb,
    'feeds', jsonb_build_object(
      'verdicts', jsonb_build_object('items', vitems,
                                     'crypto_private', (SELECT data -> 'crypto_private' FROM public.market_feed WHERE key = 'verdicts')),
      'outcomes', (SELECT data FROM public.market_feed WHERE key = 'outcomes')),
    'videos', (SELECT value FROM public.site_settings WHERE key = 'terminal_journal_videos'))
  INTO res;
  RETURN res;
END $$;

REVOKE EXECUTE ON FUNCTION public.tg_terminal(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tg_terminal(text, text, text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
