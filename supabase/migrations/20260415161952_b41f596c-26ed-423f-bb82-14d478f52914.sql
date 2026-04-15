CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings" ON public.site_settings
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read settings" ON public.site_settings
  FOR SELECT TO authenticated USING (true);

INSERT INTO public.site_settings (key, value) VALUES ('dashboard_welcome_video', '');