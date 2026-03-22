CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) NOT NULL,
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  sender text NOT NULL CHECK (sender IN ('customer', 'bot', 'human')),
  content text NOT NULL,
  platform_message_id text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
