-- Two confirmed users so the Playwright e2e can sign in without a real inbox.
-- Development project only — never run this against production.
-- Re-runnable: it updates the password if the users already exist.
--
-- The app's own sign-in is an email OTP; these users exist purely so
-- /api/test-login (dev-only) can exchange a password for a session.

create extension if not exists "pgcrypto";

do $$
declare
  seed record;
begin
  for seed in
    select * from (values
      ('owner@waakya.test', 'waakya-e2e-owner-pass'),
      ('staff@waakya.test', 'waakya-e2e-staff-pass'),
      -- Never joins an org, so the "no business yet" path stays testable
      -- however many times the suite has run before.
      ('noorg@waakya.test', 'waakya-e2e-noorg-pass')
    ) as t(email, password)
  loop
    if exists (select 1 from auth.users u where u.email = seed.email) then
      update auth.users
         set encrypted_password = crypt(seed.password, gen_salt('bf')),
             email_confirmed_at = coalesce(email_confirmed_at, now()),
             updated_at         = now()
       where email = seed.email;
    else
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data
      ) values (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(), 'authenticated', 'authenticated',
        seed.email, crypt(seed.password, gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb
      );
    end if;
  end loop;
end $$;

-- Mirror them into profiles so the app has a name to show.
insert into profiles (id, full_name)
select u.id,
       case u.email
         when 'owner@waakya.test' then 'Rakesh'
         when 'staff@waakya.test' then 'Raju'
         else 'Naya Owner'
       end
from auth.users u
where u.email in ('owner@waakya.test', 'staff@waakya.test', 'noorg@waakya.test')
on conflict (id) do update set full_name = excluded.full_name;

-- GoTrue scans these varchar columns into Go strings, so NULL makes every
-- sign-in fail with "Database error querying schema". Manual inserts must
-- write empty strings, not NULL.
update auth.users
   set confirmation_token         = coalesce(confirmation_token, ''),
       recovery_token             = coalesce(recovery_token, ''),
       email_change_token_new     = coalesce(email_change_token_new, ''),
       email_change               = coalesce(email_change, ''),
       email_change_token_current = coalesce(email_change_token_current, ''),
       phone_change               = coalesce(phone_change, ''),
       phone_change_token         = coalesce(phone_change_token, ''),
       reauthentication_token     = coalesce(reauthentication_token, '')
 where email in ('owner@waakya.test', 'staff@waakya.test', 'noorg@waakya.test');

-- Password sign-in needs an identity row for the email provider.
insert into auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select u.id::text, u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email,
                          'email_verified', true, 'phone_verified', false),
       'email', now(), now(), now()
from auth.users u
where u.email in ('owner@waakya.test', 'staff@waakya.test', 'noorg@waakya.test')
  and not exists (
    select 1 from auth.identities i
    where i.user_id = u.id and i.provider = 'email'
  );
