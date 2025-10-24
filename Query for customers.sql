Query for customers
SELECT id,company_name,first_name,last_name,email,metadata,phone,created_at,updated_at FROM customer;

Query for Orders
SELECT id,region_id,display_id,customer_id,sales_channel_id,status,is_draft_order,email,currency_code,shipping_address_id,billing_address_id,no_notification,metadata,created_at,updated_at,deleted_at,canceled_at
FROM "order";

find invoices
SELECT
  id,
  metadata ->> 'magento_increment_id'    AS magento_order,
  jsonb_array_length(metadata -> 'magento_invoices') AS invoice_count,
  metadata -> 'magento_invoices'         AS invoices
FROM "order"
WHERE jsonb_typeof(metadata -> 'magento_invoices') = 'array'
  AND jsonb_array_length(metadata -> 'magento_invoices') > 0
ORDER BY created_at;

