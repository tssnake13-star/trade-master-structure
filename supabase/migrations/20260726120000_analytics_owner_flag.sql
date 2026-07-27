-- Визиты владельца считаем ОТДЕЛЬНО, а не выбрасываем.
-- Раньше заходы админа просто не писались — теперь пишутся с пометкой is_owner,
-- в основную статистику не попадают, но видны отдельным блоком в дашборде.

ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;

-- частичный индекс: обычных событий будет большинство, их и фильтруем чаще
CREATE INDEX IF NOT EXISTS analytics_events_visitors_idx
  ON public.analytics_events (created_at DESC) WHERE NOT is_owner;

-- Старую 7-аргументную версию убираем явно: CREATE OR REPLACE с другим числом
-- параметров создал бы вторую перегрузку, и PostgREST не понял бы, какую звать.
DROP FUNCTION IF EXISTS public.track_event(text, text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.track_event(
  _session_id text,
  _event_type text,
  _path       text,
  _target     text    DEFAULT NULL,
  _referrer   text    DEFAULT NULL,
  _source     text    DEFAULT NULL,
  _device     text    DEFAULT NULL,
  _is_owner   boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _event_type IS NULL OR _event_type NOT IN ('pageview', 'scroll', 'click') THEN
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

GRANT EXECUTE ON FUNCTION public.track_event(text, text, text, text, text, text, text, boolean) TO anon, authenticated;

-- Сводка: основные цифры — только по посетителям; визиты владельца отдельным блоком.
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

  SELECT jsonb_build_object(
    'visits',      (SELECT count(DISTINCT session_id) FROM analytics_events WHERE created_at >= _from AND NOT is_owner),
    'pageviews',   (SELECT count(*) FROM analytics_events WHERE created_at >= _from AND NOT is_owner AND event_type = 'pageview'),
    'clicks',      (SELECT count(*) FROM analytics_events WHERE created_at >= _from AND NOT is_owner AND event_type = 'click'),
    'owner',       (SELECT jsonb_build_object(
                      'visits',    count(DISTINCT session_id),
                      'pageviews', count(*) FILTER (WHERE event_type = 'pageview'),
                      'clicks',    count(*) FILTER (WHERE event_type = 'click'),
                      'last_at',   to_char(max(created_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
                    ) FROM analytics_events WHERE created_at >= _from AND is_owner),
    'by_day',      (SELECT coalesce(jsonb_agg(x ORDER BY x->>'day'), '[]'::jsonb) FROM (
                      SELECT jsonb_build_object(
                        'day', to_char(date_trunc('day', created_at), 'YYYY-MM-DD'),
                        'visits', count(DISTINCT session_id),
                        'views', count(*) FILTER (WHERE event_type = 'pageview')
                      ) AS x
                      FROM analytics_events WHERE created_at >= _from AND NOT is_owner
                      GROUP BY date_trunc('day', created_at)
                    ) s),
    'by_source',   (SELECT coalesce(jsonb_agg(x ORDER BY (x->>'visits')::int DESC), '[]'::jsonb) FROM (
                      SELECT jsonb_build_object('source', coalesce(source, 'direct'), 'visits', count(DISTINCT session_id)) AS x
                      FROM analytics_events WHERE created_at >= _from AND NOT is_owner
                      GROUP BY coalesce(source, 'direct')
                    ) s),
    'by_device',   (SELECT coalesce(jsonb_agg(x ORDER BY (x->>'visits')::int DESC), '[]'::jsonb) FROM (
                      SELECT jsonb_build_object('device', coalesce(device, 'unknown'), 'visits', count(DISTINCT session_id)) AS x
                      FROM analytics_events WHERE created_at >= _from AND NOT is_owner
                      GROUP BY coalesce(device, 'unknown')
                    ) s),
    'by_section',  (SELECT coalesce(jsonb_agg(x ORDER BY (x->>'visits')::int DESC), '[]'::jsonb) FROM (
                      SELECT jsonb_build_object('section', target, 'visits', count(DISTINCT session_id)) AS x
                      FROM analytics_events WHERE created_at >= _from AND NOT is_owner AND event_type = 'scroll' AND target IS NOT NULL
                      GROUP BY target
                    ) s),
    'by_click',    (SELECT coalesce(jsonb_agg(x ORDER BY (x->>'clicks')::int DESC), '[]'::jsonb) FROM (
                      SELECT jsonb_build_object('target', target, 'clicks', count(*), 'visits', count(DISTINCT session_id)) AS x
                      FROM analytics_events WHERE created_at >= _from AND NOT is_owner AND event_type = 'click' AND target IS NOT NULL
                      GROUP BY target
                    ) s)
  ) INTO _res;

  RETURN _res;
END;
$$;

GRANT EXECUTE ON FUNCTION public.analytics_summary(integer) TO authenticated;
