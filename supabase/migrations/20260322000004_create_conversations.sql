CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  platform text NOT NULL CHECK (platform IN ('messenger', 'instagram')),
  platform_user_id text NOT NULL,
  customer_name text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'handoff', 'completed', 'abandoned')),
  current_stage text DEFAULT 'greeting',
  cart jsonb DEFAULT '[]',
  customer_info jsonb,
  ai_context jsonb,
  handoff_reason text,
  handed_off_at timestamptz,
  started_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
