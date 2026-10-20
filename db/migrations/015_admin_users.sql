-- Extra dashboard logins (for example the CEO). The owner still signs in with
-- ADMIN_EMAIL / ADMIN_PASSWORD_HASH; everyone here chooses their own password
-- from an emailed link. Only a hash of each link's secret is stored.
create table if not exists admin_users (
  id                uuid primary key default gen_random_uuid(),
  email             text not null unique,
  name              text,
  password_hash     text,
  invite_token_hash text unique,
  invite_expires_at timestamptz,
  invited_by        text,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  password_set_at   timestamptz,
  last_login_at     timestamptz
);
alter table admin_users enable row level security;
