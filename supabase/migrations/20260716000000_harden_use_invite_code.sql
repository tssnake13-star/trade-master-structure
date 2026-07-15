-- use_invite_code hardening.
--
-- Investigation on the live DB (2026-07-15) showed the function ALREADY guards
-- against redeeming a code on behalf of another user — its body contains:
--
--     IF auth.uid() IS DISTINCT FROM _user_id THEN
--       RAISE EXCEPTION 'User ID mismatch';
--     END IF;
--
-- so the client-supplied _user_id cannot be used to target a victim. The rest of
-- the function also GRANTS COURSE ACCESS (RETURNING course_ids ... FOREACH ...),
-- so it is deliberately left untouched here — recreating the body would risk
-- breaking course granting.
--
-- The only residual gap: EXECUTE was granted to anon/PUBLIC, so an
-- unauthenticated caller (auth.uid() = NULL) could still invoke it with
-- _user_id = NULL. Redeeming an invite code is always an authenticated action,
-- so we remove anon/PUBLIC execute and keep it for `authenticated` only.
REVOKE EXECUTE ON FUNCTION public.use_invite_code(text, uuid) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.use_invite_code(text, uuid) TO authenticated;
