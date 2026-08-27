-- Удаление неактивных аккаунтов без действующего тарифа.
--
-- Правило владельца (24.08.2026): пока тариф горит, аккаунт не трогаем. Как
-- только тариф закончился, человек становится обычным бесплатником: не заходил
-- 14 дней после окончания — аккаунт удаляется.
--
-- ⚠️ Почему нужна колонка profiles.paid_until.
-- Истёкшие доступы удаляются автоматически (expire_course_access), и дату
-- окончания тарифа взять больше неоткуда. Без неё тот, кто не заходил весь
-- оплаченный год, был бы удалён на следующий день после окончания доступа —
-- вместо обещанных 14 дней. Поэтому при гашении доступа дата пишется в профиль,
-- и срок считается от неё И от последнего входа: удаляем, только когда обе
-- даты старше срока.
--
-- Админов и супер-админа не трогаем никогда.
-- Функция inactive_free_accounts() показывает список ДО удаления — он виден
-- в админке, потому что удаление необратимо.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paid_until timestamptz;

COMMENT ON COLUMN public.profiles.paid_until IS
  'Когда закончился последний платный доступ. Пишется при гашении доступа: от этой даты отсчитывается срок до удаления аккаунта.';

INSERT INTO public.site_settings (key, value) VALUES
  ('purge_inactive_enabled', '0'),
  ('purge_inactive_days',    '14')
ON CONFLICT (key) DO NOTHING;

-- Гашение истёкших доступов теперь ещё и запоминает дату окончания в профиле.
CREATE OR REPLACE FUNCTION public.expire_course_access()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  _deleted integer;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admin can expire access';
  END IF;

  WITH gone AS (
    DELETE FROM public.course_access
    WHERE expires_at IS NOT NULL AND expires_at <= now()
    RETURNING user_id, expires_at
  ), stamped AS (
    UPDATE public.profiles p
    SET paid_until = greatest(coalesce(p.paid_until, g.expires_at), g.expires_at)
    FROM (SELECT user_id, max(expires_at) AS expires_at FROM gone GROUP BY user_id) g
    WHERE p.user_id = g.user_id
    RETURNING 1
  )
  SELECT count(*) INTO _deleted FROM gone;

  RETURN _deleted;
END;
$fn$;

DROP FUNCTION IF EXISTS public.purge_inactive_free_accounts();
DROP FUNCTION IF EXISTS public.inactive_free_accounts();

CREATE FUNCTION public.inactive_free_accounts()
RETURNS TABLE (user_id uuid, email text, full_name text, last_seen_at timestamptz, created_at timestamptz, paid_until timestamptz)
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
  SELECT p.user_id, p.email, p.full_name, p.last_seen_at, p.created_at, p.paid_until
  FROM public.profiles p
  WHERE NOT public.has_role(p.user_id, 'admin')
    AND NOT public.is_super_admin_email(p.email)
    -- пока тариф горит, доступ лежит в course_access: такого не трогаем
    AND NOT EXISTS (SELECT 1 FROM public.course_access ca WHERE ca.user_id = p.user_id)
    -- срок отсчитывается и от последнего входа, и от окончания тарифа
    AND coalesce(p.last_seen_at, p.created_at) < now() - (_days || ' days')::interval
    AND coalesce(p.paid_until, p.created_at)   < now() - (_days || ' days')::interval
  ORDER BY coalesce(p.last_seen_at, p.created_at);
END;
$fn$;

CREATE FUNCTION public.purge_inactive_free_accounts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  _uid uuid;
  _n integer := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admin can purge accounts';
  END IF;

  IF coalesce((SELECT value FROM public.site_settings WHERE key = 'purge_inactive_enabled'), '0') <> '1' THEN
    RETURN 0;
  END IF;

  FOR _uid IN SELECT a.user_id FROM public.inactive_free_accounts() a LOOP
    -- то же, что делает delete_student, но без требования админской сессии:
    -- у планировщика её нет
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

REVOKE EXECUTE ON FUNCTION public.inactive_free_accounts()       FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.purge_inactive_free_accounts() FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.inactive_free_accounts()       TO authenticated;
GRANT  EXECUTE ON FUNCTION public.purge_inactive_free_accounts() TO authenticated;

-- Раз в сутки ночью: срок считается днями, чаще незачем.
SELECT cron.unschedule('purge-inactive-free-accounts')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-inactive-free-accounts');

SELECT cron.schedule(
  'purge-inactive-free-accounts',
  '30 3 * * *',
  'SELECT public.purge_inactive_free_accounts();'
);
