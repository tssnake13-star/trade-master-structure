
ALTER TABLE public.course_access
ADD COLUMN unlocked_lessons integer[] NOT NULL DEFAULT '{1}';
