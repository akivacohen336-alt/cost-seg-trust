-- A provider that gives a conservative-to-high range does so for its
-- deduction and percent too, not only the tax benefit. Keeping both ends lets
-- every figure in a range be checked against the same column of its table.
alter table supplier_quotes add column if not exists est_first_year_deduction_high numeric(14,2);
alter table supplier_quotes add column if not exists increased_deduction_high numeric(14,2);
alter table supplier_quotes add column if not exists reclassified_pct_high numeric(5,2);
