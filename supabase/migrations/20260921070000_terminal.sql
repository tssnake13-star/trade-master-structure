-- ТЕРМИНАЛ TRADE MASTER — витрина рынка в кабинете школы.
--
-- Считает по-прежнему ядро на VPS: бот раз в расчётный круг кладёт сюда
-- ГОТОВЫЙ результат и ссылки на картинки. Ни одной формулы и ни одного
-- правила в базе нет — только то, что ученик и так видит в телеграме.
-- Поэтому наружу VPS закрыт: он пишет, его никто не дёргает.
--
-- Доступ к терминалу — ОТДЕЛЬНЫЙ доступ экосистемы, со сроком у всех
-- (решение владельца 21.09.2026). Курсом его не оформляем: набор курсов
-- и подписка на терминал — разные вещи, и выдаются они по-разному.

-- ─────────────────────────── ДОСТУП ───────────────────────────

CREATE TABLE IF NOT EXISTS public.terminal_access (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  note       text
);

COMMENT ON TABLE public.terminal_access IS
  'Подписка на терминал. Срок обязателен: бессрочных нет.';

ALTER TABLE public.terminal_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "terminal_access_own_select" ON public.terminal_access;
CREATE POLICY "terminal_access_own_select"
  ON public.terminal_access FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "terminal_access_admin_select" ON public.terminal_access;
CREATE POLICY "terminal_access_admin_select"
  ON public.terminal_access FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "terminal_access_admin_insert" ON public.terminal_access;
CREATE POLICY "terminal_access_admin_insert"
  ON public.terminal_access FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "terminal_access_admin_update" ON public.terminal_access;
CREATE POLICY "terminal_access_admin_update"
  ON public.terminal_access FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "terminal_access_admin_delete" ON public.terminal_access;
CREATE POLICY "terminal_access_admin_delete"
  ON public.terminal_access FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Истёкший доступ НЕ удаляем: срок проверяется на чтении. Так владелец
-- видит в карточке ученика, когда доступ был и когда кончился, а данные
-- закрываются ровно в срок, без ожидания уборщика.
CREATE OR REPLACE FUNCTION public.has_terminal_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.terminal_access
     WHERE user_id = _user_id AND expires_at > now()
  ) OR public.has_role(_user_id, 'admin');
$$;

-- ─────────────────────────── ВИТРИНА РЫНКА ───────────────────────────

CREATE TABLE IF NOT EXISTS public.market_snapshot (
  symbol       text PRIMARY KEY,               -- как в боте: XAUUSD, EURUSD, DXY
  title        text,                           -- «Золото / Доллар США»
  group_key    text,                           -- группа: DXY, JPY, AUD…
  sort_order   integer NOT NULL DEFAULT 100,

  price        numeric,
  price_text   text,                           -- цена уже с нужным числом знаков

  side         text,                           -- LONG / SHORT / null
  scenario     text,                           -- 1 / 2 / null
  confirmation boolean,                        -- подтверждение по дневке
  guide        text,                           -- поводырь одной строкой

  w_dir text, w_n integer,                     -- критерии недели
  d_dir text, d_n integer,                     -- критерии дневки

  trend_w1     text,                           -- накопления: неделя
  trend_d1     text,                           -- накопления: дневка
  trend_total  text,                           -- итог по накоплениям

  cycle_w1     jsonb,                          -- угол, якорь, цель, пройдено, запас…
  cycle_d1     jsonb,

  card_lines   text[],                         -- карточка словами, как в боте
  trend_lines  text[],
  range_lines  text[],
  extra        jsonb,                          -- режим рынка, резонанс, аналоги

  chart_cycles text,                           -- путь картинки в хранилище
  chart_trend  text,
  bars_at      timestamptz,                    -- время последней ЗАКРЫТОЙ свечи
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.market_snapshot IS
  'Готовый разбор инструмента из ядра на VPS. Пишет только сервис-ключ.';

ALTER TABLE public.market_snapshot ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_snapshot_select" ON public.market_snapshot;
CREATE POLICY "market_snapshot_select"
  ON public.market_snapshot FOR SELECT
  TO authenticated
  USING (public.has_terminal_access(auth.uid()));

-- Записи из браузера нет вообще: политик на INSERT/UPDATE/DELETE не заводим,
-- пишет только сервис-ключ с VPS (он обходит RLS).

CREATE TABLE IF NOT EXISTS public.market_meta (
  id         integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  updated_at timestamptz,                      -- когда ядро посчитало круг
  bars_at    timestamptz,                      -- последняя закрытая свеча
  build      text,                             -- сборка бота
  note       text
);

ALTER TABLE public.market_meta ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "market_meta_select" ON public.market_meta;
CREATE POLICY "market_meta_select"
  ON public.market_meta FOR SELECT
  TO authenticated
  USING (public.has_terminal_access(auth.uid()));

REVOKE ALL ON public.market_snapshot FROM anon;
REVOKE ALL ON public.market_meta     FROM anon;
GRANT SELECT ON public.market_snapshot TO authenticated;
GRANT SELECT ON public.market_meta     TO authenticated;

-- ─────────────────────────── КАРТИНКИ ───────────────────────────

-- Закрытый ящик: ссылка сама по себе картинку не отдаёт, нужен вход
-- в кабинет и действующая подписка.
INSERT INTO storage.buckets (id, name, public)
VALUES ('terminal', 'terminal', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "terminal_objects_select" ON storage.objects;
CREATE POLICY "terminal_objects_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'terminal' AND public.has_terminal_access(auth.uid()));
