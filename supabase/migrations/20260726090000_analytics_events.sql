-- Своя веб-аналитика (вместо внешних счётчиков).
--
-- Приватность заложена в схему: НЕ пишем IP, cookie и user-agent. session_id —
-- случайная строка, живущая одну сессию браузера (sessionStorage), связать её с
-- человеком нельзя. Поэтому персональных данных таблица не содержит.
--
-- Писать события может кто угодно, но ТОЛЬКО через функцию track_event
-- (SECURITY DEFINER): она валидирует тип события и обрезает длину полей, так что
-- залить мусор произвольной структуры или прочитать чужие данные нельзя.
-- Читать статистику может только админ.

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id          bigserial PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now(),
  session_id  text        NOT NULL,
  event_type  text        NOT NULL CHECK (event_type IN ('pageview', 'scroll', 'click')),
  path        text        NOT NULL,
  target      text,   -- click: id кнопки · scroll: id секции
  referrer    text,   -- домен, откуда пришли
  source      text,   -- нормализованный источник: instagram / telegram / google / zen / direct
  device      text    CHECK (device IN ('mobile', 'desktop'))
);

CREATE INDEX IF NOT EXISTS analytics_events_created_at_idx ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_type_idx       ON public.analytics_events (event_type);
CREATE INDEX IF NOT EXISTS analytics_events_session_idx    ON public.analytics_events (session_id);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Читать — только администратор школы.
DROP POLICY IF EXISTS "analytics_admin_read" ON public.analytics_events;
CREATE POLICY "analytics_admin_read" ON public.analytics_events
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Прямая запись клиентам запрещена: только через track_event().
REVOKE INSERT, UPDATE, DELETE ON public.analytics_events FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.track_event(
  _session_id text,
  _event_type text,
  _path       text,
  _target     text DEFAULT NULL,
  _referrer   text DEFAULT NULL,
  _source     text DEFAULT NULL,
  _device     text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- неизвестный тип события молча игнорируем (не роняем клиента ошибкой)
  IF _event_type IS NULL OR _event_type NOT IN ('pageview', 'scroll', 'click') THEN
    RETURN;
  END IF;
  IF _session_id IS NULL OR _path IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.analytics_events (session_id, event_type, path, target, referrer, source, device)
  VALUES (
    left(_session_id, 64),
    _event_type,
    left(_path, 255),
    left(_target, 128),
    left(_referrer, 255),
    left(_source, 64),
    CASE WHEN _device IN ('mobile', 'desktop') THEN _device ELSE NULL END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_event(text, text, text, text, text, text, text) TO anon, authenticated;

-- Сводка для дашборда: считает всё одним запросом на стороне БД, чтобы не тянуть
-- в браузер сырые события. Доступна только админу (проверка внутри).
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
    'visits',      (SELECT count(DISTINCT session_id) FROM analytics_events WHERE created_at >= _from),
    'pageviews',   (SELECT count(*) FROM analytics_events WHERE created_at >= _from AND event_type = 'pageview'),
    'clicks',      (SELECT count(*) FROM analytics_events WHERE created_at >= _from AND event_type = 'click'),
    'by_day',      (SELECT coalesce(jsonb_agg(x ORDER BY x->>'day'), '[]'::jsonb) FROM (
                      SELECT jsonb_build_object(
                        'day', to_char(date_trunc('day', created_at), 'YYYY-MM-DD'),
                        'visits', count(DISTINCT session_id),
                        'views', count(*) FILTER (WHERE event_type = 'pageview')
                      ) AS x
                      FROM analytics_events WHERE created_at >= _from
                      GROUP BY date_trunc('day', created_at)
                    ) s),
    'by_source',   (SELECT coalesce(jsonb_agg(x ORDER BY (x->>'visits')::int DESC), '[]'::jsonb) FROM (
                      SELECT jsonb_build_object('source', coalesce(source, 'direct'), 'visits', count(DISTINCT session_id)) AS x
                      FROM analytics_events WHERE created_at >= _from
                      GROUP BY coalesce(source, 'direct')
                    ) s),
    'by_device',   (SELECT coalesce(jsonb_agg(x ORDER BY (x->>'visits')::int DESC), '[]'::jsonb) FROM (
                      SELECT jsonb_build_object('device', coalesce(device, 'unknown'), 'visits', count(DISTINCT session_id)) AS x
                      FROM analytics_events WHERE created_at >= _from
                      GROUP BY coalesce(device, 'unknown')
                    ) s),
    'by_section',  (SELECT coalesce(jsonb_agg(x ORDER BY (x->>'visits')::int DESC), '[]'::jsonb) FROM (
                      SELECT jsonb_build_object('section', target, 'visits', count(DISTINCT session_id)) AS x
                      FROM analytics_events WHERE created_at >= _from AND event_type = 'scroll' AND target IS NOT NULL
                      GROUP BY target
                    ) s),
    'by_click',    (SELECT coalesce(jsonb_agg(x ORDER BY (x->>'clicks')::int DESC), '[]'::jsonb) FROM (
                      SELECT jsonb_build_object('target', target, 'clicks', count(*), 'visits', count(DISTINCT session_id)) AS x
                      FROM analytics_events WHERE created_at >= _from AND event_type = 'click' AND target IS NOT NULL
                      GROUP BY target
                    ) s)
  ) INTO _res;

  RETURN _res;
END;
$$;

GRANT EXECUTE ON FUNCTION public.analytics_summary(integer) TO authenticated;
