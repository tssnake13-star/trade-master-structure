
-- Add course_ids array column
ALTER TABLE public.invite_codes ADD COLUMN course_ids uuid[] DEFAULT '{}';

-- Migrate existing data from course_id to course_ids
UPDATE public.invite_codes
SET course_ids = CASE WHEN course_id IS NOT NULL THEN ARRAY[course_id] ELSE '{}' END;

-- Drop old course_id column and its foreign key
ALTER TABLE public.invite_codes DROP COLUMN course_id;

-- Update use_invite_code to handle array of courses
CREATE OR REPLACE FUNCTION public.use_invite_code(_code text, _user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _course_ids uuid[];
  _expires_in_days integer;
  _expires_at timestamptz;
  _cid uuid;
BEGIN
  -- Mark the code as used
  UPDATE public.invite_codes
  SET used = true, used_by = _user_id, used_at = now()
  WHERE code = _code
    AND (NOT used OR NOT is_single_use)
    AND (expires_in_days IS NULL OR created_at + (expires_in_days || ' days')::interval > now())
  RETURNING invite_codes.course_ids, expires_in_days INTO _course_ids, _expires_in_days;

  IF _course_ids IS NOT NULL AND array_length(_course_ids, 1) > 0 THEN
    IF _expires_in_days IS NOT NULL THEN
      _expires_at := now() + (_expires_in_days || ' days')::interval;
    END IF;

    FOREACH _cid IN ARRAY _course_ids LOOP
      INSERT INTO public.course_access (user_id, course_id, unlocked_lessons, expires_at)
      VALUES (_user_id, _cid, ARRAY[1], _expires_at)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END;
$function$;
