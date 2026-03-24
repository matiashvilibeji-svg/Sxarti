-- Performance indexes for frequently queried columns
-- These indexes speed up the most common dashboard and bot queries

CREATE INDEX IF NOT EXISTS idx_delivery_zones_tenant_id ON delivery_zones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_tenant_active ON delivery_zones(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_active ON products(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_conversations_tenant_id ON conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_started ON conversations(tenant_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_created ON orders(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_tenant_created ON messages(tenant_id, created_at DESC);
