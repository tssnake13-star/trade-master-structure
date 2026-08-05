-- Истёкшие доступы удаляются сами, без ручной чистки.
--
-- Контент RLS-политики закрывали и раньше (20260613090000), но сама строка
-- оставалась в таблице навсегда: в админке висели доступы людей, у которых
-- доступа фактически уже нет, и админ удалял их руками.
--
-- Прогресс (lesson_progress) не трогаем: он и так переживает потерю доступа
-- и вернётся, если доступ выдадут заново.

CREATE OR REPLACE FUNCTION public.expire_course_access()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  _deleted integer;
BEGIN
  -- Планировщик ходит без сессии (auth.uid() = NULL) — ему можно.
  -- Из браузера функцию может позвать только админ.
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admin can expire access';
  END IF;

  -- Записи без expires_at (бессрочные) не трогаем: правило «granted_at + 90 дней»
  -- годится для показа, но для удаления строки оно слишком грубое.
  WITH gone AS (
    DELETE FROM public.course_access
    WHERE expires_at IS NOT NULL AND expires_at <= now()
    RETURNING 1
  )
  SELECT count(*) INTO _deleted FROM gone;

  RETURN _deleted;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.expire_course_access() FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.expire_course_access() TO authenticated;

DROP TABLE IF EXISTS public.course_access_expired;

-- Каждые 10 минут, чтобы доступ гас практически в момент истечения.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule('expire-course-access')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-course-access');

SELECT cron.schedule(
  'expire-course-access',
  '*/10 * * * *',
  'SELECT public.expire_course_access();'
);
