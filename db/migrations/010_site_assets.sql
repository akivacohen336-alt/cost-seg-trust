-- Photos and logo for the public website, copied from the Lovable site.
-- Kept in the database (like client files) and served from /img/<name>.
create table if not exists site_assets (
  name         text primary key,
  content_type text not null,
  data         bytea not null,
  updated_at   timestamptz not null default now()
);
alter table site_assets enable row level security;
