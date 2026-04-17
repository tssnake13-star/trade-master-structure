-- Public bucket for site assets (logos, videos, hero, favicon, og)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Public can view site assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

-- Admin write
CREATE POLICY "Admins can upload site assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));

-- Allow public read of site_settings so non-auth visitors get logos
CREATE POLICY "Public can read site settings"
ON public.site_settings FOR SELECT
USING (true);