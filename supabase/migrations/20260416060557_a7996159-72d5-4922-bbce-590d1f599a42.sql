CREATE OR REPLACE FUNCTION public.use_invite_code(_code text, _user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _course_id uuid;
  _expires_in_days integer;
  _expires_at timestamptz;
BEGIN
  -- Mark the code as used
  UPDATE public.invite_codes
  SET used = true, used_by = _user_id, used_at = now()
  WHERE code = _code
    AND (NOT used OR NOT is_single_use)
    AND (expires_in_days IS NULL OR created_at + (expires_in_days || ' days')::interval > now())
  RETURNING course_id, expires_in_days INTO _course_id, _expires_in_days;

  -- Create course_access if the code is linked to a course
  IF _course_id IS NOT NULL THEN
    IF _expires_in_days IS NOT NULL THEN
      _expires_at := now() + (_expires_in_days || ' days')::interval;
    END IF;

    INSERT INTO public.course_access (user_id, course_id, unlocked_lessons, expires_at)
    VALUES (_user_id, _course_id, ARRAY[1], _expires_at)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;