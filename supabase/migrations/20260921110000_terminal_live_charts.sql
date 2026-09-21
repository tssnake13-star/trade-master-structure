-- ТЕРМИНАЛ, заход 3 (21.09.2026): живые графики.
--
-- Мост на VPS забирает у рисовалки бота то, что она уже нарисовала (свечи, накопления,
-- угол, цели, переходы, свинги, реверс, номера пояснений), и кладёт сюда данными.
-- Браузер рисует по ним тот же график, только с наведением, приближением и слоями.
-- Правил здесь нет — только готовые фигуры в координатах «номер свечи · цена».
--
-- kind: cycles — сценарий (/info), trend — накопления (/trend), all — все циклы (/cycle).

CREATE TABLE IF NOT EXISTS public.market_chart (
  symbol     text NOT NULL,
  kind       text NOT NULL CHECK (kind IN ('cycles', 'trend', 'all')),
  scene      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (symbol, kind)
);

COMMENT ON TABLE public.market_chart IS
  'Живые графики терминала: то же, что на картинке бота, данными. Пишет только сервис-ключ.';

ALTER TABLE public.market_chart ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_chart_select" ON public.market_chart;
CREATE POLICY "market_chart_select"
  ON public.market_chart FOR SELECT
  TO authenticated
  USING (public.has_terminal_access(auth.uid()));

REVOKE ALL ON public.market_chart FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.market_chart FROM authenticated;
GRANT SELECT ON public.market_chart TO authenticated;
