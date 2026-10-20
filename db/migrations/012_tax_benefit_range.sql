-- A provider may give a range (conservative to high end), and may figure its
-- tax benefit on the extra deduction from the study or on all year-1
-- depreciation. Only the first kind can be compared across providers.
alter table supplier_quotes add column if not exists est_first_year_tax_savings_high numeric(14,2);
alter table supplier_quotes add column if not exists tax_benefit_on text check (tax_benefit_on in ('extra','total'));
