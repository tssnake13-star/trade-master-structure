
CREATE TABLE public.lesson_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL,
  video_url_alt TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lesson videos"
ON public.lesson_videos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage lesson videos"
ON public.lesson_videos
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_lesson_videos_lesson_id ON public.lesson_videos(lesson_id);
CREATE INDEX idx_lesson_videos_sort_order ON public.lesson_videos(lesson_id, sort_order);
