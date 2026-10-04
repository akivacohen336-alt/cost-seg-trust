-- Test suppliers for safe end-to-end testing. Their emails use "+" addressing,
-- so anything "sent to a supplier" lands in the owner's own Gmail inbox.
-- Real suppliers are added later from the admin Suppliers page.
insert into suppliers (company_name, contact_name, email, description, is_test) values
  ('Test Supplier A', 'Test Contact A', 'akivacohen336+supplier-a@gmail.com', 'Test only: full engineering studies', true),
  ('Test Supplier B', 'Test Contact B', 'akivacohen336+supplier-b@gmail.com', 'Test only: desktop studies', true),
  ('Test Supplier C', 'Test Contact C', 'akivacohen336+supplier-c@gmail.com', 'Test only: residential and STR', true)
on conflict (email) do nothing;
