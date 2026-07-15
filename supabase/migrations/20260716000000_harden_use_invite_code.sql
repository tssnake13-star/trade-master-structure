-- Hardening: use_invite_code must record the AUTHENTICATED caller, never a
-- client-supplied user id. Previously it trusted `_user_id` from the client,
-- which let a caller "burn" a code on behalf of another user. Now it uses
-- auth.uid() and rejects any mismatch. (No data-theft vector either way, but
-- this removes the loose parameter.) Signature is kept so the client call still
-- works; the passed _user_id is validated against auth.uid().
CREATE OR REPLACE FUNCTION public.use_invite_code(_code text, _user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Cannot redeem an invite code for another user';
  END IF;

  UPDATE public.invite_codes
  SET used = true, used_by = auth.uid(), used_at = now()
  WHERE code = _code
    AND (NOT used OR NOT is_single_use)
    AND (expires_in_days IS NULL OR created_at + (expires_in_days || ' days')::interval > now());
END;
$$;
