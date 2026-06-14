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