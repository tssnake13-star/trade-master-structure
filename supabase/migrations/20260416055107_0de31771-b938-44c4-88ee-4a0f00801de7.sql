
ALTER TABLE public.invite_codes
ADD COLUMN course_id uuid REFERENCES public.courses(id);
