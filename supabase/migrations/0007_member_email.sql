-- Notifications need a colleague's email address, which lives in auth.users
-- and is not reachable through RLS.
--
-- Deliberately an RPC rather than a `profiles.email` column: a column would
-- make every colleague's address fall out of any `select * from profiles`,
-- while this returns one address at a time and only to somebody who already
-- shares an org with that person.
create or replace function org_member_email(p_user uuid)
returns text as $$
  select u.email
  from auth.users u
  where u.id = p_user
    and shares_org_with(p_user);
$$ language sql stable security definer set search_path = public, auth, pg_temp;

revoke all on function org_member_email(uuid) from public;
grant execute on function org_member_email(uuid) to authenticated;
