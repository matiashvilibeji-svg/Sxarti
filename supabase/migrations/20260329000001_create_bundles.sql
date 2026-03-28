-- Product Bundles: bundles + bundle_items tables
-- Allows businesses to create product bundles with optional bot auto-suggest

-- ============================================================
-- 1. bundles — bundle definitions per tenant
-- ============================================================
CREATE TABLE IF NOT EXISTS bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('fixed', 'percentage')),
  discount_value numeric(10,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  bot_auto_suggest boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bundles_select" ON bundles
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "bundles_insert" ON bundles
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "bundles_update" ON bundles
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "bundles_delete" ON bundles
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- ============================================================
-- 2. bundle_items — products within a bundle
-- ============================================================
CREATE TABLE IF NOT EXISTS bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  UNIQUE(bundle_id, product_id)
);

ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bundle_items_select" ON bundle_items
  FOR SELECT TO authenticated
  USING (bundle_id IN (SELECT id FROM bundles WHERE tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())));

CREATE POLICY "bundle_items_insert" ON bundle_items
  FOR INSERT TO authenticated
  WITH CHECK (bundle_id IN (SELECT id FROM bundles WHERE tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())));

CREATE POLICY "bundle_items_update" ON bundle_items
  FOR UPDATE TO authenticated
  USING (bundle_id IN (SELECT id FROM bundles WHERE tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())))
  WITH CHECK (bundle_id IN (SELECT id FROM bundles WHERE tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())));

CREATE POLICY "bundle_items_delete" ON bundle_items
  FOR DELETE TO authenticated
  USING (bundle_id IN (SELECT id FROM bundles WHERE tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())));

-- ============================================================
-- 3. Performance indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_bundles_tenant_active ON bundles(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle ON bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_items_product ON bundle_items(product_id);
