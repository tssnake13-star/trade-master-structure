-- Пробный доступ к ECHO-GATE INSIDE на 7 дней — сам, при регистрации (Сергей 07.10.2026).
--
-- Зачем замки: доступ выдаётся автоматически, и человек может зарегистрироваться
-- заново с другой почты. Поэтому в пробном доступе открыто то, что доказывает
-- качество решений, но не заменяет подписку:
--   открыто   — журнал решений Сергея с задержкой в сутки, итоги решений,
--               2–3 инструмента целиком (список — site_settings 'terminal_trial_symbols');
--   под замком — скринер и ТОП-лист, тренд, остальные инструменты.
-- Когда Сергей выдаёт доступ через админку, is_trial = false и открывается всё.
-- Замки стоят здесь, в правилах чтения базы, а не только на экране.

-- 1. Флаг пробного доступа
ALTER TABLE public.terminal_access
  ADD COLUMN IF NOT EXISTS is_trial boolean NOT NULL DEFAULT false;

-- 2. Полный доступ: подписка (не пробная) или админ
CREATE OR REPLACE FUNCTION public.has_full_terminal_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT _user_id IS NOT NULL
     AND _user_id = auth.uid()
     AND (
       EXISTS (SELECT 1 FROM public.terminal_access
                WHERE user_id = _user_id AND expires_at > now() AND NOT is_trial)
       OR public.has_role(_user_id, 'admin')
     );
$$;

REVOKE EXECUTE ON FUNCTION public.has_full_terminal_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_full_terminal_access(uuid) TO authenticated;

-- 3. Инструменты, открытые в пробном доступе (меняются в site_settings без кода)
CREATE OR REPLACE FUNCTION public.terminal_trial_symbols()
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT array_agg(upper(trim(s)))
       FROM unnest(string_to_array(
              (SELECT value FROM public.site_settings WHERE key = 'terminal_trial_symbols'), ',')) AS s
      WHERE trim(s) <> ''),
    ARRAY['EURUSD', 'GBPUSD', 'XAUUSD']
  );
$$;

REVOKE EXECUTE ON FUNCTION public.terminal_trial_symbols() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.terminal_trial_symbols() TO authenticated;

-- 4. Правила чтения: полный доступ видит всё, пробный — только открытое.
--    has_terminal_access по-прежнему означает «есть действующий доступ любого вида».
DROP POLICY IF EXISTS "market_snapshot_select" ON public.market_snapshot;
CREATE POLICY "market_snapshot_select"
  ON public.market_snapshot FOR SELECT
  TO authenticated
  USING (
    public.has_full_terminal_access(auth.uid())
    OR (public.has_terminal_access(auth.uid()) AND symbol = ANY (public.terminal_trial_symbols()))
  );

DROP POLICY IF EXISTS "market_chart_select" ON public.market_chart;
CREATE POLICY "market_chart_select"
  ON public.market_chart FOR SELECT
  TO authenticated
  USING (
    public.has_full_terminal_access(auth.uid())
    OR (public.has_terminal_access(auth.uid()) AND symbol = ANY (public.terminal_trial_symbols()))
  );

-- ленты: пробному — только итоги решений; журнал решений — через функцию ниже, с задержкой
DROP POLICY IF EXISTS "market_feed_select" ON public.market_feed;
CREATE POLICY "market_feed_select"
  ON public.market_feed FOR SELECT
  TO authenticated
  USING (
    public.has_full_terminal_access(auth.uid())
    OR (public.has_terminal_access(auth.uid()) AND key = 'outcomes')
  );

-- market_meta (время расчёта) остаётся открытым для любого действующего доступа — правило не меняется.

-- 5. Журнал решений для пробного доступа: только решения старше суток
CREATE OR REPLACE FUNCTION public.terminal_trial_verdicts()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  doc    jsonb;
  item   jsonb;
  kept   jsonb := '[]'::jsonb;
  hidden jsonb := '[]'::jsonb;
  t      timestamptz;
BEGIN
  IF NOT public.has_terminal_access(auth.uid()) THEN
    RETURN NULL;
  END IF;
  SELECT data INTO doc FROM public.market_feed WHERE key = 'verdicts';
  FOR item IN SELECT * FROM jsonb_array_elements(COALESCE(doc -> 'items', '[]'::jsonb)) LOOP
    BEGIN
      t := (item ->> 'time')::timestamptz;
    EXCEPTION WHEN others THEN
      t := NULL;
    END;
    IF t IS NOT NULL AND t <= now() - interval '24 hours' THEN
      kept := kept || jsonb_build_array(item);
    ELSE
      -- скрытое решение: только время публикации, без инструмента и стороны
      hidden := hidden || jsonb_build_array(item -> 'time');
    END IF;
  END LOOP;
  RETURN jsonb_build_object('items', kept, 'hidden', hidden);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.terminal_trial_verdicts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.terminal_trial_verdicts() TO authenticated;

-- 6. Список всех инструментов (только названия) — чтобы пробный видел, что под замком
CREATE OR REPLACE FUNCTION public.terminal_trial_catalog()
RETURNS TABLE (symbol text, title text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.symbol, s.title
    FROM public.market_snapshot s
   WHERE public.has_terminal_access(auth.uid())
   ORDER BY s.sort_order, s.symbol;
$$;

REVOKE EXECUTE ON FUNCTION public.terminal_trial_catalog() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.terminal_trial_catalog() TO authenticated;

-- 7. Пробный доступ на 7 дней — сам, при регистрации (профиль создаётся триггером handle_new_user)
CREATE OR REPLACE FUNCTION public.grant_terminal_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.terminal_access (user_id, expires_at, is_trial, note)
  VALUES (NEW.user_id, now() + interval '7 days', true, 'пробный доступ при регистрации')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_terminal_trial ON public.profiles;
CREATE TRIGGER trg_grant_terminal_trial
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.grant_terminal_trial();
