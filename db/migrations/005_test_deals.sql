-- Test deals can only ever go to test suppliers. Every deal that exists when
-- this runs was made while testing, before real suppliers were added.
alter table deals add column if not exists is_test boolean not null default false;
update deals set is_test = true;
