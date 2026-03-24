-- Strengthen ai_chat_messages INSERT policy to verify session belongs to same tenant
DROP POLICY "Tenant owners can create chat messages" ON ai_chat_messages;

CREATE POLICY "Tenant owners can create chat messages"
  ON ai_chat_messages FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
    AND session_id IN (SELECT id FROM ai_chat_sessions WHERE tenant_id = ai_chat_messages.tenant_id)
  );
