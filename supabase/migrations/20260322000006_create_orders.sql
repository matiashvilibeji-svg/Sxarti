CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  conversation_id uuid REFERENCES conversations(id),
  order_number text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text NOT NULL,
  items jsonb NOT NULL,
  subtotal numeric(10,2) NOT NULL,
  delivery_fee numeric(10,2) DEFAULT 0,
  total numeric(10,2) NOT NULL,
  delivery_zone_id uuid REFERENCES delivery_zones(id),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed')),
  delivery_status text DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'shipped', 'delivered')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
