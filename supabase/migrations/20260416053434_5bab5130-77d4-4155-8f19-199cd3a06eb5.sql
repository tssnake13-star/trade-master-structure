
ALTER TABLE public.profiles
ADD COLUMN is_blocked boolean NOT NULL DEFAULT false;

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

  DELETE FROM public.lesson_progress WHERE user_id = _user_id;
  DELETE FROM public.course_access WHERE user_id = _user_id;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE user_id = _user_id;
  DELETE FROM auth.users WHERE id = _user_id;
END;
$$;
