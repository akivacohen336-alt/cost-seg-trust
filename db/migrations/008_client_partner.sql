-- A referred client stays with the partner who first referred them: later
-- deals from the same client are credited to that partner automatically.
alter table clients add column if not exists partner_id uuid references partners(id) on delete set null;
update clients c set partner_id = (
  select d.partner_id from deals d where d.client_id = c.id and d.partner_id is not null order by d.created_at limit 1)
where c.partner_id is null;
