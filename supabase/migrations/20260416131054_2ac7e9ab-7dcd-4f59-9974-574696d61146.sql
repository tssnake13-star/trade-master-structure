
-- 1. Fix lessons RLS: restrict SELECT to enrolled users / free courses / admins
DROP POLICY IF EXISTS "Authenticated users can view lessons" ON public.lessons;

CREATE POLICY "Users can view accessible lessons" ON public.lessons
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = lessons.course_id
      AND (
        c.is_free = true
        OR EXISTS (
          SELECT 1 FROM public.course_access ca
          WHERE ca.user_id = auth.uid()
          AND ca.course_id = c.id
          AND (ca.expires_at IS NULL OR ca.expires_at > now())
        )
      )
    )
  );

-- 2. Fix lesson_videos RLS: restrict SELECT to enrolled users / free courses / admins
DROP POLICY IF EXISTS "Authenticated users can view lesson videos" ON public.lesson_videos;

CREATE POLICY "Users can view accessible lesson videos" ON public.lesson_videos
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.courses c ON c.id = l.course_id
      WHERE l.id = lesson_videos.lesson_id
      AND (
        c.is_free = true
        OR EXISTS (
          SELECT 1 FROM public.course_access ca
          WHERE ca.user_id = auth.uid()
          AND ca.course_id = c.id
          AND (ca.expires_at IS NULL OR ca.expires_at > now())
        )
      )
    )
  );

-- 3. Fix user_roles: block non-admin INSERT
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Fix use_invite_code: validate caller identity
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
  -- Ensure caller is the target user
  IF auth.uid() IS DISTINCT FROM _user_id THEN
    RAISE EXCEPTION 'User ID mismatch';
  END IF;

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
