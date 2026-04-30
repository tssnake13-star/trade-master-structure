-- Helper: check if email belongs to a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin_email(_email text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(_email) IN ('tssnake13@gmail.com', 'tssnake@list.ru')
$$;

-- Helper: check if a given user_id is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _user_id
      AND public.is_super_admin_email(p.email)
  )
$$;

-- Trigger: protect user_roles changes for super admins
CREATE OR REPLACE FUNCTION public.protect_super_admin_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _target_uid uuid;
  _caller uuid := auth.uid();
BEGIN
  IF TG_OP = 'DELETE' THEN
    _target_uid := OLD.user_id;
  ELSE
    _target_uid := NEW.user_id;
  END IF;

  -- If target is super admin and caller is NOT super admin -> forbid
  IF public.is_super_admin(_target_uid) AND (
       _caller IS NULL OR NOT public.is_super_admin(_caller)
     ) THEN
    -- Allow if nothing actually changes (no-op safety)
    IF TG_OP = 'UPDATE' AND OLD.role = NEW.role AND OLD.user_id = NEW.user_id THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Нельзя изменить роль главного администратора';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_super_admin_roles ON public.user_roles;
CREATE TRIGGER trg_protect_super_admin_roles
BEFORE UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin_roles();

-- Trigger: protect profiles (block/email/delete) for super admins
CREATE OR REPLACE FUNCTION public.protect_super_admin_profiles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _target_email text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _target_email := OLD.email;
  ELSE
    _target_email := NEW.email;
  END IF;

  IF public.is_super_admin_email(COALESCE(_target_email, '')) AND (
       _caller IS NULL OR NOT public.is_super_admin(_caller)
     ) THEN
    IF TG_OP = 'UPDATE' THEN
      -- Forbid blocking or email change by non-super-admins
      IF NEW.is_blocked IS DISTINCT FROM OLD.is_blocked THEN
        RAISE EXCEPTION 'Нельзя заблокировать главного администратора';
      END IF;
      IF NEW.email IS DISTINCT FROM OLD.email THEN
        RAISE EXCEPTION 'Нельзя изменить email главного администратора';
      END IF;
      RETURN NEW;
    END IF;
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Нельзя удалить главного администратора';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_super_admin_profiles ON public.profiles;
CREATE TRIGGER trg_protect_super_admin_profiles
BEFORE UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin_profiles();

-- Update delete_student to reject super admin deletion explicitly
CREATE OR REPLACE FUNCTION public.delete_student(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can delete students';
  END IF;

  IF public.is_super_admin(_user_id) AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Нельзя удалить главного администратора';
  END IF;

  DELETE FROM public.lesson_progress WHERE user_id = _user_id;
  DELETE FROM public.course_access WHERE user_id = _user_id;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE user_id = _user_id;
  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;

-- Ensure both super admins (if they exist) currently have admin role
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'admin'::app_role
FROM public.profiles p
WHERE public.is_super_admin_email(p.email)
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.user_id AND ur.role = 'admin'
  );