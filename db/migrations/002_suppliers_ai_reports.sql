-- Phases 5-7: supplier responses, AI standardization, comparison approval, PDF reports.

alter table deals add column if not exists quotes_window_closed_at timestamptz;

-- Supplier invites: count link re-sends; "late" is derived from responded_at > due_at.
alter table supplier_invites add column if not exists link_sent_count integer not null default 0;
alter table supplier_invites add column if not exists decline_reason text;
-- When a link is re-issued (reminder or resend), the previous link keeps working too.
alter table supplier_invites add column if not exists previous_token_hash text;
create index if not exists supplier_invites_prev_token_idx on supplier_invites(previous_token_hash);
create index if not exists supplier_invites_pending_idx on supplier_invites(status, due_at) where status in ('invited','viewed');

-- Supplier responses: the uploaded proposal is kept in the database (max 4 MB),
-- plus what the AI read from it.
alter table supplier_quotes drop column if exists proposal_file_path;
alter table supplier_quotes add column if not exists proposal_pdf bytea;
alter table supplier_quotes add column if not exists proposal_filename text;
alter table supplier_quotes add column if not exists ai_status text not null default 'skipped'
  check (ai_status in ('pending','done','failed','skipped'));
alter table supplier_quotes add column if not exists ai_error text;
alter table supplier_quotes add column if not exists ai_mismatches jsonb not null default '[]'::jsonb;
alter table supplier_quotes add column if not exists ai_notes jsonb not null default '{}'::jsonb;

-- Comparison approval flow: draft -> awaiting_approval -> sent.
alter table comparisons drop constraint if exists comparisons_status_check;
alter table comparisons add constraint comparisons_status_check check (status in ('draft','awaiting_approval','sent'));
alter table comparisons add column if not exists client_message text;
alter table comparisons add column if not exists summary_source text;

-- Every generated one-pager PDF, newest version last.
create table if not exists pdf_reports (
  id            uuid primary key default gen_random_uuid(),
  deal_id       uuid not null references deals(id) on delete cascade,
  comparison_id uuid not null references comparisons(id) on delete cascade,
  version       integer not null,
  filename      text not null,
  pdf           bytea not null,
  created_at    timestamptz not null default now(),
  sent_at       timestamptz,
  sent_to       text,
  unique (comparison_id, version)
);
alter table pdf_reports enable row level security;
