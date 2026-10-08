-- Referral partners. Each partner has a referral code (their link tags new
-- deals) and a private portal link to follow the deals they brought in.
-- The portal link is derived from SESSION_SECRET + link_version, so it can be
-- shown again any time and replaced by bumping link_version.
create table if not exists partners (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  company       text,
  email         citext,
  phone         text,
  code          text not null unique check (code ~ '^[a-z0-9-]{2,40}$'),
  commission    text,
  notes         text,
  active        boolean not null default true,
  link_version  integer not null default 1,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table partners enable row level security;
drop trigger if exists partners_touch on partners;
create trigger partners_touch before update on partners for each row execute function touch_updated_at();

alter table deals add column if not exists partner_id uuid references partners(id) on delete set null;
alter table deals add column if not exists partner_commission numeric(12,2);
alter table deals add column if not exists partner_commission_paid boolean not null default false;
create index if not exists deals_partner_idx on deals (partner_id, created_at desc);
