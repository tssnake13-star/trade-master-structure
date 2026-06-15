ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Authenticated users can view courses" ON public.courses;

CREATE POLICY "Authenticated users can view courses" ON public.courses
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR is_archived = false);