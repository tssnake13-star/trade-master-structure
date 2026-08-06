-- Счётчик считает людей, а не автоматические заходы.
--
-- Разбор 6 августа: из 76 заходов за 10 дней 49 оказались «нулевыми» — один
-- pageview, ноль секунд на странице, почти все direct/desktop, причём по
-- нескольку подряд в одну минуту. Так люди не читают: это сканеры и боты,
-- которые дёргают страницу ради превью.
--
-- Кликов они не делали, зато втрое раздували число посетителей и во столько же
-- занижали конверсию: 6 кликов на 76 «посетителей» читаются как 8%, хотя живых
-- людей было 17 — и это 35%.
--
-- Сырые события не трогаем: фильтр стоит на чтении, критерий можно поменять
-- в любой момент, не потеряв историю.
--
-- Живым считается визит, где человек себя проявил:
--   пробыл на странице 5 секунд (событие alive),
--   ИЛИ посмотрел хотя бы два блока,
--   ИЛИ нажал кнопку,
--   ИЛИ между первым и последним событием прошло 3 секунды.
-- Событие alive нужно для тех, кто читает первый экран не прокручивая: без него
-- такой визит неотличим от бота — событий больше нет, длительность нулевая.

ALTER TABLE public.analytics_events DROP CONSTRAINT IF EXISTS analytics_events_event_type_check;
ALTER TABLE public.analytics_events ADD CONSTRAINT analytics_events_event_type_check
  CHECK (event_type IN ('pageview', 'scroll', 'click', 'alive'));

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
    coalesce(_is_owner, false)
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
  _from timestamptz := now() - (greatest(coalesce(_days, 30), 1) || ' days')::interval;
  _res  jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admin can read analytics';
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
