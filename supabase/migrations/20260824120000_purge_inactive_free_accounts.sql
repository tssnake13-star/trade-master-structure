-- Удаление неактивных бесплатных аккаунтов.
--
-- Решение владельца от 24.08.2026: аккаунт без оплаты, в который не заходят
-- 14 дней, удаляется. Оплаченные не трогаются вообще и живут до конца срока.
--
-- ⚠️ ТРИ ЗАЩИТЫ, КОТОРЫЕ НЕЛЬЗЯ УБИРАТЬ.
--
-- 1. `tariff IS NULL`. Пометка тарифа — главный признак «этот человек платил».
--    Она важнее записей о доступе: истёкшие доступы удаляются автоматически
--    (expire_course_access), и через месяц после окончания бывший ученик по
--    таблице course_access неотличим от случайной регистрации.
-- 2. Нет ни одной записи в course_access — даже к бесплатному курсу.
-- 3. Не использовал инвайт-код: код выдаётся руками, случайный человек его
--    не получает.
--
-- Плюс никогда не трогаем админов и супер-админа.
--
-- Функция `inactive_free_accounts()` показывает, кого удалит, ДО удаления —
-- список виден в админке.

-- Настройки: срок и выключатель. Меняются из админки, без правки кода.
INSERT INTO public.site_settings (key, value) VALUES
  ('purge_inactive_enabled', '1'),
  ('purge_inactive_days',    '14')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.inactive_free_accounts()
RETURNS TABLE (user_id uuid, email text, full_name text, last_seen_at timestamptz, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  _days integer;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admin can list inactive accounts';
  END IF;

  SELECT coalesce(nullif(s.value, '')::integer, 14) INTO _days
  FROM public.site_settings s WHERE s.key = 'purge_inactive_days';
  _days := coalesce(_days, 14);

  RETURN QUERY
  SELECT p.user_id, p.email, p.full_name, p.last_seen_at, p.created_at
  FROM public.profiles p
  WHERE p.tariff IS NULL
    AND coalesce(p.last_seen_at, p.created_at) < now() - (_days || ' days')::interval
    AND NOT public.has_role(p.user_id, 'admin')
    AND NOT public.is_super_admin_email(p.email)
    AND NOT EXISTS (SELECT 1 FROM public.course_access ca WHERE ca.user_id = p.user_id)
    AND NOT EXISTS (SELECT 1 FROM public.invite_codes ic WHERE ic.used_by = p.user_id)
  ORDER BY coalesce(p.last_seen_at, p.created_at);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.purge_inactive_free_accounts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  _uid uuid;
  _n integer := 0;
BEGIN
  -- планировщик ходит без сессии; из браузера вызвать может только админ
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admin can purge accounts';
  END IF;

  IF coalesce((SELECT value FROM public.site_settings WHERE key = 'purge_inactive_enabled'), '0') <> '1' THEN
    RETURN 0;
  END IF;

  FOR _uid IN SELECT a.user_id FROM public.inactive_free_accounts() a LOOP
    -- то же, что делает delete_student, но без требования админской сессии:
    -- её у планировщика нет
    DELETE FROM public.lesson_progress WHERE user_id = _uid;
    DELETE FROM public.course_access   WHERE user_id = _uid;
    DELETE FROM public.user_roles      WHERE user_id = _uid;
    DELETE FROM public.profiles        WHERE user_id = _uid;
    DELETE FROM auth.users             WHERE id = _uid;
    _n := _n + 1;
  END LOOP;

  RETURN _n;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.inactive_free_accounts()      FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.purge_inactive_free_accounts() FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.inactive_free_accounts()      TO authenticated;
GRANT  EXECUTE ON FUNCTION public.purge_inactive_free_accounts() TO authenticated;

-- Раз в сутки, ночью. Чаще незачем: срок считается днями.
SELECT cron.unschedule('purge-inactive-free-accounts')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-inactive-free-accounts');

SELECT cron.schedule(
  'purge-inactive-free-accounts',
  '30 3 * * *',
  'SELECT public.purge_inactive_free_accounts();'
);
