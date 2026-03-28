-- Enable moddatetime extension if not already enabled
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- Order automation rules table
CREATE TABLE order_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN ('order_created', 'payment_confirmed', 'order_shipped', 'order_delivered')),
  action_type TEXT NOT NULL CHECK (action_type IN ('google_sheet_sync', 'message_customer', 'notify_owner')),
  action_config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast rule lookup by tenant + trigger
CREATE INDEX idx_order_rules_tenant_trigger ON order_rules(tenant_id, trigger_event) WHERE is_active = true;

-- RLS
ALTER TABLE order_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their own order rules"
  ON order_rules FOR SELECT
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Tenants can insert their own order rules"
  ON order_rules FOR INSERT
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Tenants can update their own order rules"
  ON order_rules FOR UPDATE
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Tenants can delete their own order rules"
  ON order_rules FOR DELETE
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- Updated_at trigger
CREATE TRIGGER set_order_rules_updated_at
  BEFORE UPDATE ON order_rules
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);
