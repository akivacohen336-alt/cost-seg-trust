-- Leads from the main website (costsegtrust.com, built in Lovable) may not
-- include every property fact. A deal can be saved without the purchase
-- price or in-service date; Akiva fills them in before sending to suppliers.
alter table deals alter column purchase_price drop not null;
alter table deals alter column placed_in_service drop not null;
