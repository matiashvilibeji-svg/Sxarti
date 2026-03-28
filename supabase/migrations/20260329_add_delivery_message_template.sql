-- Add delivery message template to tenants
ALTER TABLE tenants
ADD COLUMN delivery_message_template TEXT DEFAULT NULL;

COMMENT ON COLUMN tenants.delivery_message_template IS 'Custom message template sent to customer when order is delivered. Supports {order_number}, {customer_name}, {total} placeholders.';
