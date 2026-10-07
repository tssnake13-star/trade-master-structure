-- Ночная чистка не трогает платных подписчиков ECHO-GATE INSIDE (07.10.2026).
--
-- Правило владельца (24.08.2026, подтверждено Сергеем 07.10.2026 и записано
-- в политику конфиденциальности /privacy): ничего не покупал и 14 дней не
-- заходил — аккаунт удаляется; купил — пока оплаченный срок идёт, аккаунт
-- не трогаем, срок закончился — 14 дней, и аккаунт удаляется.
--
-- ⚠️ Что было не так. inactive_free_accounts() смотрела только на course_access,
-- а подписка ECHO-GATE INSIDE с 21.09.2026 живёт в terminal_access. С 07.10
-- подписка продаётся всем, и у подписчика без курса строк в course_access нет:
-- 14 дней без входа в кабинет, и ночная чистка (03:30 UTC, purge_inactive_enabled=1)
-- удаляла его посреди оплаченного срока. После конца подписки 14 дней считались
-- только от последнего входа, без даты окончания.
--
-- Пробный доступ (is_trial) платным не считается: пробник без входа 14 дней
-- удаляется, как и раньше. Подпись функции та же, purge_inactive_free_accounts()
-- и список в админке подхватывают правку сами. Права (GRANT) сохраняются.

CREATE OR REPLACE FUNCTION public.inactive_free_accounts()
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
  SELECT p.user_id, p.email, p.full_name, p.last_seen_at, p.created_at,
         greatest(p.paid_until, ta.expires_at) AS paid_until
  FROM public.profiles p
  -- платная подписка терминала: у пользователя не больше одной строки (user_id — ключ)
  LEFT JOIN public.terminal_access ta
    ON ta.user_id = p.user_id AND NOT ta.is_trial
  WHERE NOT public.has_role(p.user_id, 'admin')
    AND NOT public.is_super_admin_email(p.email)
    -- пока тариф горит, доступ лежит в course_access: такого не трогаем
    AND NOT EXISTS (SELECT 1 FROM public.course_access ca WHERE ca.user_id = p.user_id)
    -- пока идёт оплаченная подписка (или она бессрочная), тоже не трогаем
    AND NOT (ta.user_id IS NOT NULL AND (ta.expires_at IS NULL OR ta.expires_at > now()))
    -- срок отсчитывается и от последнего входа, и от окончания платного доступа
    AND coalesce(p.last_seen_at, p.created_at) < now() - (_days || ' days')::interval
    AND coalesce(greatest(p.paid_until, ta.expires_at), p.created_at) < now() - (_days || ' days')::interval
  ORDER BY coalesce(p.last_seen_at, p.created_at);
END;
$fn$;
