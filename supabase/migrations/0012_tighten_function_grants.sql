-- Slice 9. Two findings from the database security linter, and a note on the
-- ones that are intentional.
--
-- 1. Pin search_path on the two remaining functions that lacked it. Without it
--    a caller can shadow a table these functions name and change what they do.
alter function set_updated_at()      set search_path = public, pg_temp;
alter function storage_org_id(text)  set search_path = public, pg_temp;

-- 2. Supabase grants EXECUTE on new functions in `public` to `anon` by
--    default, so the earlier `revoke ... from public` did not cover it. These
--    three all require a session and already raise or return nothing without
--    one; revoking makes that structural rather than merely true.
revoke execute on function create_org(text, text)  from anon;
revoke execute on function accept_invite(text)     from anon;
revoke execute on function org_member_email(uuid)  from anon;

-- Deliberately still callable by `anon`:
--   invite_preview      an invitee reads it before they have an account, and
--                       it returns only the business name, the invited name
--                       and whether the link is spent.
--   record_otp_request  sign-in happens before there is a session; it returns
--                       a boolean and never its table's contents.
--   is_org_member / is_org_admin / shares_org_with
--                       these are evaluated inside RLS policies by whichever
--                       role is querying, so revoking would turn an empty
--                       result into a permission error. Each answers only
--                       about auth.uid(), which is null for anon.
--
-- `otp_requests` has RLS on and no policies, which the linter reports as INFO.
-- That is the design: the table is unreachable except through
-- record_otp_request(), so no policy is the strongest possible policy.
