-- SAMPLE DATA — safe to delete. Draft leads for local development.
insert into public.leads (title, buy_price, sell_price, supplier_link, listing_link, notes, status)
values
  ('Sample: Silicone Lids Set (12pc)', 8.49, 24.99, 'https://example.com/supplier/1', 'https://example.com/listing/1', 'SAMPLE DATA — replace with real leads', 'draft'),
  ('Sample: Insulated Bottle 32oz', 11.20, 29.95, 'https://example.com/supplier/2', 'https://example.com/listing/2', 'SAMPLE DATA — replace with real leads', 'draft');
