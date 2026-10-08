-- Обнуление счётчиков без удаления данных и заходы владельца (Сергей 08.10.2026).
--
-- 1) «Обнулить количество просмотров страницы с ценами… политика… terms».
--    Точка отсчёта лежит в site_settings, ключ analytics_reset_at: сводка считает
--    события не раньше неё. Сырые события не трогаем, как и раньше (фильтр стоит
--    на чтении): пустое значение ключа возвращает всю историю.
--
-- 2) «Мои просмотры не должны засчитываться». В analytics.ts было написано, что браузер
--    помечается владельческим «при входе в кабинет под админом», но такого кода не было:
--    работала только ручная метка ?owner=1, и заходы Сергея с телефона шли в общий счёт.
--    Теперь track_event сам помечает событие владельческим, если запрос пришёл
--    от вошедшего в кабинет админа (auth.uid() с ролью admin).

CREATE OR REPLACE FUNCTION public.track_event(
  _session_id text,
  _event_type text,
  _path       text,
  _target     text DEFAULT NULL::text,
  _referrer   text DEFAULT NULL::text,
  _source     text DEFAULT NULL::text,
  _device     text DEFAULT NULL::text,
  _is_owner   boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- неизвестный тип события молча игнорируем (не роняем клиента ошибкой)
  IF _event_type IS NULL OR _event_type NOT IN ('pageview', 'scroll', 'click', 'alive') THEN
    RETURN;
  END IF;
  IF _session_id IS NULL OR _path IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.analytics_events (session_id, event_type, path, target, referrer, source, device, is_owner)
  VALUES (
    left(_session_id, 64),
    _event_type,
    left(_path, 255),
    left(_target, 128),
    left(_referrer, 255),
    left(_source, 64),
    CASE WHEN _device IN ('mobile', 'desktop') THEN _device ELSE NULL END,
    -- владелец: метка браузера (?owner=1) ИЛИ запрос от вошедшего админа
    coalesce(_is_owner, false)
      OR (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role))
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.analytics_summary(_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _from  timestamptz := now() - (greatest(coalesce(_days, 30), 1) || ' days')::interval;
  _reset timestamptz;
  _res   jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admin can read analytics';
  END IF;

  -- точка обнуления: считаем не раньше неё; кривое значение ключа просто не учитываем
  BEGIN
    SELECT nullif(trim(value), '')::timestamptz INTO _reset
    FROM site_settings WHERE key = 'analytics_reset_at';
  EXCEPTION WHEN others THEN
    _reset := NULL;
  END;
  IF _reset IS NOT NULL AND _reset > _from THEN
    _from := _reset;
  END IF;

  WITH ev AS (
    SELECT * FROM analytics_events WHERE created_at >= _from
  ),
  -- одна строка на визит: свойства берём по сессии, а не по каждому событию
  sess AS (
    SELECT
      session_id,
      bool_or(is_owner)                                              AS is_owner,
      (array_agg(device ORDER BY created_at))[1]                     AS device,
      (array_agg(coalesce(source, 'direct') ORDER BY created_at))[1] AS source,
      min(created_at)                                                AS started_at,
      count(*) FILTER (WHERE event_type = 'scroll')                  AS scrolls,
      bool_or(event_type = 'click')                                  AS clicked,
      bool_or(event_type = 'alive')                                  AS stayed,
      extract(epoch FROM (max(created_at) - min(created_at)))        AS seconds
    FROM ev
    GROUP BY session_id
  ),
  -- живой визит: человек задержался, полистал или нажал
  visitors AS (
    SELECT * FROM sess
    WHERE NOT is_owner
      AND (stayed OR clicked OR scrolls >= 2 OR seconds >= 3)
  ),
  -- события только тех сессий, что признаны живыми визитами
  vev AS (SELECT ev.* FROM ev JOIN visitors v ON v.session_id = ev.session_id)
  SELECT jsonb_build_object(
    'visits',      (SELECT count(*) FROM visitors),
    'pageviews',   (SELECT count(*) FROM vev WHERE event_type = 'pageview'),
    'clicks',      (SELECT count(*) FROM vev WHERE event_type = 'click'),
    'clickers',    (SELECT count(DISTINCT session_id) FROM vev WHERE event_type = 'click'),
    -- сколько заходов отсеяно как автоматические — чтобы отсев был на виду
    'skipped',     (SELECT count(*) FROM sess
                    WHERE NOT is_owner
                      AND NOT (stayed OR clicked OR scrolls >= 2 OR seconds >= 3)),
    -- с какого момента идёт счёт после обнуления (null, если не обнуляли)
    'reset_at',    CASE WHEN _reset IS NULL THEN NULL
                        ELSE to_char(_reset AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') END,
    'owner',       (SELECT jsonb_build_object(
                      'visits',    (SELECT count(*) FROM sess WHERE is_owner),
                      'pageviews', count(*) FILTER (WHERE event_type = 'pageview'),
                      'clicks',    count(*) FILTER (WHERE event_type = 'click'),
                      'last_at',   to_char(max(created_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
                    ) FROM ev WHERE is_owner),
    'by_day',      (SELECT coalesce(jsonb_agg(x ORDER BY x->>'day'), '[]'::jsonb) FROM (
                      SELECT jsonb_build_object(
                        'day',    to_char(date_trunc('day', started_at), 'YYYY-MM-DD'),
                        'visits', count(*)
                      ) AS x
                      FROM visitors GROUP BY date_trunc('day', started_at)
                    ) s),
    'by_source',   (SELECT coalesce(jsonb_agg(x ORDER BY (x->>'visits')::int DESC), '[]'::jsonb) FROM (
                      SELECT jsonb_build_object('source', source, 'visits', count(*)) AS x
                      FROM visitors GROUP BY source
                    ) s),
    'by_device',   (SELECT coalesce(jsonb_agg(x ORDER BY (x->>'visits')::int DESC), '[]'::jsonb) FROM (
                      SELECT jsonb_build_object('device', coalesce(device, 'unknown'), 'visits', count(*)) AS x
                      FROM visitors GROUP BY coalesce(device, 'unknown')
                    ) s),
    'by_page',     (SELECT coalesce(jsonb_agg(x ORDER BY (x->>'views')::int DESC), '[]'::jsonb) FROM (
                      SELECT jsonb_build_object('path', path, 'views', count(*), 'visits', count(DISTINCT session_id)) AS x
                      FROM vev WHERE event_type = 'pageview' GROUP BY path
                    ) s),
    'by_section',  (SELECT coalesce(jsonb_agg(x ORDER BY (x->>'visits')::int DESC), '[]'::jsonb) FROM (
                      SELECT jsonb_build_object('section', target, 'visits', count(DISTINCT session_id)) AS x
                      FROM vev WHERE event_type = 'scroll' AND target IS NOT NULL GROUP BY target
                    ) s),
    'by_click',    (SELECT coalesce(jsonb_agg(x ORDER BY (x->>'clicks')::int DESC), '[]'::jsonb) FROM (
                      SELECT jsonb_build_object('target', target, 'clicks', count(*), 'visits', count(DISTINCT session_id)) AS x
                      FROM vev WHERE event_type = 'click' AND target IS NOT NULL GROUP BY target
                    ) s)
  ) INTO _res;

  RETURN _res;
END;
$$;

GRANT EXECUTE ON FUNCTION public.analytics_summary(integer) TO authenticated;

-- Обнуление по просьбе Сергея 08.10.2026: счёт с момента применения миграции.
INSERT INTO public.site_settings (key, value)
VALUES ('analytics_reset_at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now();
