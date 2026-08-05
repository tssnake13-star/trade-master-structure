-- Истёкшие доступы убираются из course_access сами, без ручной чистки.
--
-- Контент RLS-политики закрывали и раньше (20260613090000), но сама строка
-- оставалась в таблице навсегда: в админке висели доступы людей, у которых
-- доступа фактически уже нет, и админ удалял их руками.
--
-- Строка не стирается, а переезжает в архив. Архив нужен двоим:
--   ученик видит «срок доступа истёк 4 августа», а не «курс не оплачен»;
--   админ видит, у кого срок вышел, — это список на продление.
-- Прогресс (lesson_progress) не трогаем: он и так переживает потерю доступа.

CREATE TABLE IF NOT EXISTS public.course_access_expired (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  unlocked_lessons integer[] NOT NULL DEFAULT '{1}',
  archived_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS course_access_expired_user_idx
  ON public.course_access_expired(user_id);

ALTER TABLE public.course_access_expired ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own expired access" ON public.course_access_expired;
CREATE POLICY "Users can view own expired access" ON public.course_access_expired
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view expired access" ON public.course_access_expired;
CREATE POLICY "Admins can view expired access" ON public.course_access_expired
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Выдали доступ заново — архивная запись убирается, чтобы «истёк» не спорил с «активен».
DROP POLICY IF EXISTS "Admins can delete expired access" ON public.course_access_expired;
CREATE POLICY "Admins can delete expired access" ON public.course_access_expired
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Переносит в архив всё, у чего вышел срок. Записи без expires_at (бессрочные)
-- не трогает — правило «granted_at + 90 дней» здесь сознательно не применяется:
-- для показа оно годится, а для удаления строки слишком грубое.
CREATE OR REPLACE FUNCTION public.expire_course_access()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _moved integer;
BEGIN
  -- Планировщик ходит без сессии (auth.uid() = NULL) — ему можно.
  -- Из браузера функцию может позвать только админ.
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admin can expire access';
  END IF;

  WITH gone AS (
    DELETE FROM public.course_access
    WHERE expires_at IS NOT NULL AND expires_at <= now()
    RETURNING user_id, course_id, granted_at, expires_at, unlocked_lessons
  ), archived AS (
    INSERT INTO public.course_access_expired
      (user_id, course_id, granted_at, expires_at, unlocked_lessons)
    SELECT user_id, course_id, granted_at, expires_at, COALESCE(unlocked_lessons, '{1}')
    FROM gone
    ON CONFLICT (user_id, course_id) DO UPDATE SET
      granted_at = EXCLUDED.granted_at,
      expires_at = EXCLUDED.expires_at,
      unlocked_lessons = EXCLUDED.unlocked_lessons,
      archived_at = now()
    RETURNING 1
  )
  SELECT count(*) INTO _moved FROM archived;

  RETURN _moved;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.expire_course_access() FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.expire_course_access() TO authenticated;

-- Каждые 10 минут, чтобы срок гас практически в момент истечения.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule('expire-course-access')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-course-access');

SELECT cron.schedule(
  'expire-course-access',
  '*/10 * * * *',
  $job$SELECT public.expire_course_access();$job$
);
