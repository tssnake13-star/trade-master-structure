
-- Create invite_codes table
CREATE TABLE public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  is_single_use boolean NOT NULL DEFAULT true,
  expires_in_days integer,
  used boolean NOT NULL DEFAULT false,
  used_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage invite codes"
ON public.invite_codes FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Function to validate invite code (security definer so it bypasses RLS)
CREATE OR REPLACE FUNCTION public.validate_invite_code(_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.invite_codes
    WHERE code = _code
      AND (NOT used OR NOT is_single_use)
      AND (expires_in_days IS NULL OR created_at + (expires_in_days || ' days')::interval > now())
  )
$$;

-- Function to mark invite code as used
CREATE OR REPLACE FUNCTION public.use_invite_code(_code text, _user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.invite_codes
  SET used = true, used_by = _user_id, used_at = now()
  WHERE code = _code
    AND (NOT used OR NOT is_single_use)
    AND (expires_in_days IS NULL OR created_at + (expires_in_days || ' days')::interval > now());
END;
$$;
