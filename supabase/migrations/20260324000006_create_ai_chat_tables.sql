-- AI Chat Sessions (owner's private chat with AI assistant)
CREATE TABLE ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'ახალი საუბარი',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Chat Messages
CREATE TABLE ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ai_chat_sessions_tenant ON ai_chat_sessions(tenant_id, created_at DESC);
CREATE INDEX idx_ai_chat_messages_session ON ai_chat_messages(session_id, created_at ASC);
CREATE INDEX idx_ai_chat_messages_tenant ON ai_chat_messages(tenant_id);

-- Enable RLS
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_chat_sessions
CREATE POLICY "Tenant owners can view their chat sessions"
  ON ai_chat_sessions FOR SELECT
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Tenant owners can create chat sessions"
  ON ai_chat_sessions FOR INSERT
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Tenant owners can update their chat sessions"
  ON ai_chat_sessions FOR UPDATE
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Tenant owners can delete their chat sessions"
  ON ai_chat_sessions FOR DELETE
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- RLS Policies for ai_chat_messages
CREATE POLICY "Tenant owners can view their chat messages"
  ON ai_chat_messages FOR SELECT
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Tenant owners can create chat messages"
  ON ai_chat_messages FOR INSERT
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Tenant owners can delete their chat messages"
  ON ai_chat_messages FOR DELETE
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
