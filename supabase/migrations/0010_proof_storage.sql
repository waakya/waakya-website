-- A private bucket for proof photos.
--
-- Cloudflare R2 is the intended home (STACK.md: 10 GB and zero egress, against
-- Supabase Storage's 1 GB). This exists so the proof path works before the R2
-- credentials land, and so a self-hosted install has somewhere to put files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proofs',
  'proofs',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','image/heic','audio/webm','audio/mpeg','audio/mp4','audio/ogg']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Objects are keyed orgs/<org_id>/tasks/<task_id>/<file>, so membership of the
-- org in the first path segment is the whole access rule.
create or replace function storage_org_id(p_name text) returns uuid as $$
  select case
    when split_part(p_name, '/', 1) = 'orgs'
     and split_part(p_name, '/', 2) ~ '^[0-9a-f-]{36}$'
    then split_part(p_name, '/', 2)::uuid
    else null
  end;
$$ language sql immutable;

drop policy if exists "proofs read by org members"  on storage.objects;
drop policy if exists "proofs write by org members" on storage.objects;

create policy "proofs read by org members" on storage.objects
  for select to authenticated
  using (bucket_id = 'proofs' and is_org_member(storage_org_id(name)));

create policy "proofs write by org members" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'proofs' and is_org_member(storage_org_id(name)));
