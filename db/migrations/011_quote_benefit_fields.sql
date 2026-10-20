-- The one-pager items the CEO asked for (Oct 19): regular vs accelerated
-- first-year depreciation, the total moved to short lives, the basis the
-- provider used, and the scope of work.
alter table supplier_quotes add column if not exists regular_first_year_depreciation numeric(14,2);
alter table supplier_quotes add column if not exists increased_deduction numeric(14,2);
alter table supplier_quotes add column if not exists accelerated_amount numeric(14,2);
alter table supplier_quotes add column if not exists depreciable_basis numeric(14,2);
alter table supplier_quotes add column if not exists scope_of_work text;
