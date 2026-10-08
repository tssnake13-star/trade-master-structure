-- Обнуление счётчика отдельной страницы (Сергей 08.10.2026).
--
-- Предыдущая миграция обнулила всю сводку, а просил он другое: «мне нужно только
-- обнулять страницу цен. Посещение сайта обнулять не надо». Поэтому:
--   1) общая точка отсчёта analytics_reset_at снимается (пустое значение = вся история);
--   2) у страниц своя точка: site_settings.analytics_page_resets, JSON {путь: момент}.
--      Она действует только на список «Страницы» (просмотры и визиты этой страницы),
--      посещения сайта, источники, устройства и воронка не трогаются.
-- Сырые события по-прежнему не удаляются.

CREATE OR REPLACE FUNCTION public.analytics_summary(_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _from        timestamptz := now() - (greatest(coalesce(_days, 30), 1) || ' days')::interval;
  _reset       timestamptz;
  _raw         jsonb;
  _page_resets jsonb := '{}'::jsonb;
  _k           text;
  _v           text;
  _res         jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admin can read analytics';
  END IF;

  -- общая точка обнуления (кнопка «вернуть всю историю» её снимает)
  BEGIN
    SELECT nullif(trim(value), '')::timestamptz INTO _reset
    FROM site_settings WHERE key = 'analytics_reset_at';
  EXCEPTION WHEN others THEN
    _reset := NULL;
  END;
  IF _reset IS NOT NULL AND _reset > _from THEN
    _from := _reset;
  END IF;

  -- точки обнуления отдельных страниц; кривые значения пропускаем
  BEGIN
    SELECT nullif(trim(value), '')::jsonb INTO _raw
    FROM site_settings WHERE key = 'analytics_page_resets';
  EXCEPTION WHEN others THEN
    _raw := NULL;
  END;
  IF _raw IS NOT NULL AND jsonb_typeof(_raw) = 'object' THEN
    FOR _k, _v IN SELECT key, value FROM jsonb_each_text(_raw) LOOP
      BEGIN
        _page_resets := _page_resets || jsonb_build_object(
          _k, to_char(_v::timestamptz AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'));
      EXCEPTION WHEN others THEN
        NULL;
      END;
    END LOOP;
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
    -- с какого момента идёт общий счёт (null — вся история) и точки отдельных страниц
    'reset_at',    CASE WHEN _reset IS NULL THEN NULL
                        ELSE to_char(_reset AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') END,
    'page_resets', _page_resets,
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
    -- страницы: у обнулённой страницы считаем только просмотры после её точки
    'by_page',     (SELECT coalesce(jsonb_agg(x ORDER BY (x->>'views')::int DESC), '[]'::jsonb) FROM (
                      SELECT jsonb_build_object('path', path, 'views', count(*), 'visits', count(DISTINCT session_id)) AS x
                      FROM vev
                      WHERE event_type = 'pageview'
                        AND (NOT (_page_resets ? path) OR created_at >= (_page_resets->>path)::timestamptz)
                      GROUP BY path
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

-- вернуть всю историю сайта: общая точка снимается
INSERT INTO public.site_settings (key, value) VALUES ('analytics_reset_at', '')
ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now();

-- обнулить только страницу цен
INSERT INTO public.site_settings (key, value)
VALUES ('analytics_page_resets',
        jsonb_build_object('/access', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))::text)
ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now();
