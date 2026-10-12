-- Client folders: private notes per client and documents you upload to a
-- client's folder (kept in the database, max 4 MB each).
alter table clients add column if not exists notes text;

create table if not exists client_files (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  deal_id      uuid references deals(id) on delete set null,
  filename     text not null,
  content_type text not null,
  size_bytes   integer not null,
  data         bytea not null,
  created_at   timestamptz not null default now()
);
create index if not exists client_files_client_idx on client_files (client_id, created_at desc);
alter table client_files enable row level security;

-- Faster client search.
create index if not exists deals_client_idx on deals (client_id, created_at desc);
