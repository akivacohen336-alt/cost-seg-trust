-- Delivery is often quoted as a range ("4 to 6 weeks"), and a provider may say
-- why a look-back / Form 3115 is not needed rather than just yes or no.
alter table supplier_quotes add column if not exists turnaround_days_high integer;
alter table supplier_quotes add column if not exists lookback_note text;
