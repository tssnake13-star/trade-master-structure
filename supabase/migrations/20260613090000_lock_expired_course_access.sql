-- Lock course content once the training period ends.
--
-- The existing RLS policies treated a NULL expires_at as permanent access.
-- The dashboard, however, locks a course when the training period is over,
-- where "over" = expires_at, or granted_at + 90 days when expires_at is NULL
-- (the same rule used by the on-dashboard countdown). These policies are
-- realigned so the server enforces exactly the same expiry as the client and
-- a student cannot reach lesson content by direct URL after the term ends.
--
-- granted_at is NOT NULL (default now()), so COALESCE always yields a value.
-- lesson_progress is intentionally left untouched: a student's progress is
-- preserved and becomes visible again if access is re-granted.

-- 1. lessons
DROP POLICY IF EXISTS "Users can view accessible lessons" ON public.lessons;

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
          AND COALESCE(ca.expires_at, ca.granted_at + interval '90 days') > now()
        )
      )
    )
  );

-- 2. lesson_videos
DROP POLICY IF EXISTS "Users can view accessible lesson videos" ON public.lesson_videos;

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
          AND COALESCE(ca.expires_at, ca.granted_at + interval '90 days') > now()
        )
      )
    )
  );
