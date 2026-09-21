-- ТЕРМИНАЛ, заход 2 (21.09.2026): общие ленты и третья картинка.
--
-- Ленты — те же тексты, что подписчик получает в боте:
--   screener  — /top, ТОЛЬКО одобренный владельцем (кэш бот пишет по ✅ ОДОБРЯЮ)
--   trend     — /trend, весь список
--   resonance — /scan
--   verdicts  — допуски и отказы, ушедшие подписчикам (ОТМЕНА и молчание не идут)
-- Одна таблица «ключ → документ»: лент немного, и каждая читается целиком.
--
-- chart_all — картинка «все циклы» (/cycle): неделя и дневка в обе стороны.

ALTER TABLE public.market_snapshot ADD COLUMN IF NOT EXISTS chart_all text;

CREATE TABLE IF NOT EXISTS public.market_feed (
  key        text PRIMARY KEY,
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.market_feed IS
  'Ленты терминала тем же текстом, что уходит подписчикам в боте. Пишет только сервис-ключ.';

ALTER TABLE public.market_feed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_feed_select" ON public.market_feed;
CREATE POLICY "market_feed_select"
  ON public.market_feed FOR SELECT
  TO authenticated
  USING (public.has_terminal_access(auth.uid()));

REVOKE ALL ON public.market_feed FROM anon;
GRANT SELECT ON public.market_feed TO authenticated;

-- Права по умолчанию дают вошедшим запись во все новые таблицы. Правила базы
-- (RLS) её и так не пускают, но TRUNCATE мимо RLS ходит — оставляем витрине
-- только чтение. terminal_access пишет админ из кабинета: запись оставлена,
-- её режут политики «только админ».
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.market_snapshot, public.market_meta, public.market_feed FROM authenticated;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.terminal_access FROM authenticated;
REVOKE ALL ON public.terminal_access FROM anon;
