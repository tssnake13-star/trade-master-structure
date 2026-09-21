-- «Глаз системы», финальная проверка 21.09.2026: функция доступа отвечает только
-- про того, кто спрашивает.
--
-- Было: has_terminal_access(любой_id) можно было вызвать даже без входа и узнать,
-- открыт ли «Глаз» другому человеку (или админ ли он). Данных рынка это не
-- открывало, но чужое знать незачем. Правила чтения зовут её всегда с
-- auth.uid() — для них ничего не меняется.

CREATE OR REPLACE FUNCTION public.has_terminal_access(_user_id uuid)
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
                WHERE user_id = _user_id AND expires_at > now())
       OR public.has_role(_user_id, 'admin')
     );
$$;

REVOKE EXECUTE ON FUNCTION public.has_terminal_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_terminal_access(uuid) TO authenticated;
