-- Akiva's real suppliers (2026-10-06). Adding them sends nothing: a supplier
-- is only emailed when Akiva presses Send on a real (non-test) deal.
insert into suppliers (company_name, contact_name, email, is_test) values
  ('CRE-US', 'Dana Udumulla', 'dana@cre-us.org', false),
  ('Specialty Tax Advisors', 'Marco Hermez', 'marco@specialtytaxadvisors.com', false),
  ('SegPro Solutions', 'Mark Santiago', 'mark@segprosolutions.com', false),
  ('RE Cost Seg', 'Anne Harrison', 'anne@recostseg.com', false),
  ('CSSI Services', 'Daniel Boyd', 'daniel.boyd@cssiservices.com', false),
  ('Engineered Tax Services', 'Michael D''Onofrio', 'mdonofrio@engineeredtaxservices.com', false)
on conflict (email) do nothing;
