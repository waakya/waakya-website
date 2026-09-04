-- The invitee is joining a specific business, so their first screen should be
-- in that business's language rather than the app default. `invite_preview`
-- now returns it; the join page sets the locale cookie from it.
drop function if exists invite_preview(text);

create or replace function invite_preview(p_token text)
returns table (
  org_name         text,
  org_language     text,
  full_name        text,
  already_accepted boolean
) as $$
  select o.name, o.language, i.full_name, i.accepted_at is not null
  from invites i
  join orgs o on o.id = i.org_id
  where i.token = p_token
    and i.expires_at > now();
$$ language sql stable security definer set search_path = public, pg_temp;

revoke all on function invite_preview(text) from public;
grant execute on function invite_preview(text) to anon, authenticated;
