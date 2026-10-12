-- Messages sent from the public website's contact page.
create table if not exists contact_messages (
  id          bigserial primary key,
  full_name   text not null,
  email       text not null,
  phone       text,
  topic       text not null,
  message     text not null,
  handled     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists contact_messages_created_idx on contact_messages (created_at desc);
alter table contact_messages enable row level security;
