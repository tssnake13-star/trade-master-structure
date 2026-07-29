-- Исправление подсчёта в аналитике. Две реальные ошибки, найденные при разборе
-- реальных данных за 26–29 июля:
--
-- 1. КОНВЕРСИЯ МОГЛА ПРЕВЫСИТЬ 100%. «Дошли до действия» считалось как
--    клики / посетители, но клики — это СОБЫТИЯ, а посетители — ЛЮДИ. Один
--    человек, нажавший три кнопки, давал 300%. Теперь возвращаем ещё и
--    `clickers` — число людей, сделавших хотя бы один клик.
--
-- 2. ОДНА СЕССИЯ ПОПАДАЛА В ДВЕ ГРУППЫ СРАЗУ. is_owner, device и source
--    писались в каждое событие отдельно. Если пометка владельца появлялась
--    в середине визита (или менялась ширина окна), одна и та же сессия
--    считалась и «посетителем», и «владельцем» — и одновременно mobile и
--    desktop. Суммы по группам расходились с общим числом.
--    Теперь свойства визита определяются ОДИН раз на сессию:
--      владелец — если хотя бы одно событие помечено;
--      устройство и источник — по первому событию визита.

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
      min(created_at)                                                AS started_at
    FROM ev
    GROUP BY session_id
  ),
  visitors AS (SELECT * FROM sess WHERE NOT is_owner),
  -- события только тех сессий, что признаны визитами посетителей
  vev AS (SELECT ev.* FROM ev JOIN visitors v ON v.session_id = ev.session_id)
  SELECT jsonb_build_object(
    'visits',      (SELECT count(*) FROM visitors),
    'pageviews',   (SELECT count(*) FROM vev WHERE event_type = 'pageview'),
    'clicks',      (SELECT count(*) FROM vev WHERE event_type = 'click'),
    -- НОВОЕ: сколько ЧЕЛОВЕК нажали хотя бы одну кнопку (для честной конверсии)
    'clickers',    (SELECT count(DISTINCT session_id) FROM vev WHERE event_type = 'click'),
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

-- Чистим следы проверок, чтобы статистика начиналась с честных данных.
DELETE FROM public.analytics_events
WHERE source IN ('verification', 'test_claude')
   OR path = '/verify-check'
   OR session_id LIKE 'chk\_%'
   OR session_id LIKE 'verify\_%';
