-- AI Assistant: Knowledge Sources, Entries, Documents, Instructions, Behavior Rules
-- + new personality columns on tenants

-- ============================================================
-- 1. knowledge_sources — toggleable data-source flags per tenant
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('products', 'orders', 'conversations', 'faqs', 'delivery_zones')),
  is_enabled boolean NOT NULL DEFAULT true,
  synced_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, source_type)
);

ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_sources_select" ON knowledge_sources
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "knowledge_sources_insert" ON knowledge_sources
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "knowledge_sources_update" ON knowledge_sources
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- ============================================================
-- 2. knowledge_entries — custom knowledge cards (warranty, returns, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_entries_select" ON knowledge_entries
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "knowledge_entries_insert" ON knowledge_entries
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "knowledge_entries_update" ON knowledge_entries
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "knowledge_entries_delete" ON knowledge_entries
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- ============================================================
-- 3. knowledge_documents — uploaded PDF/DOCX/TXT files
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('pdf', 'docx', 'txt')),
  extracted_text text,
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_documents_select" ON knowledge_documents
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "knowledge_documents_insert" ON knowledge_documents
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "knowledge_documents_update" ON knowledge_documents
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "knowledge_documents_delete" ON knowledge_documents
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- ============================================================
-- 4. bot_instructions — main instruction text per tenant
-- ============================================================
CREATE TABLE IF NOT EXISTS bot_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  main_instruction text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bot_instructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bot_instructions_select" ON bot_instructions
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "bot_instructions_insert" ON bot_instructions
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "bot_instructions_update" ON bot_instructions
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- ============================================================
-- 5. behavior_rules — toggleable rules
-- ============================================================
CREATE TABLE IF NOT EXISTS behavior_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rule_text text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE behavior_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "behavior_rules_select" ON behavior_rules
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "behavior_rules_insert" ON behavior_rules
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "behavior_rules_update" ON behavior_rules
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "behavior_rules_delete" ON behavior_rules
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- ============================================================
-- 6. New personality columns on tenants
-- ============================================================
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS bot_response_length integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS bot_emoji_usage integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS bot_sales_aggressiveness integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS bot_greeting_message text NOT NULL DEFAULT 'გამარჯობა! რით შემიძლია დაგეხმაროთ? 😊';

-- ============================================================
-- 7. Storage bucket for knowledge documents
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-documents', 'knowledge-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Upload policy: authenticated users can upload to their tenant folder
CREATE POLICY "knowledge_docs_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'knowledge-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Read policy: authenticated users can read their tenant's files
CREATE POLICY "knowledge_docs_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'knowledge-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Delete policy: authenticated users can delete their tenant's files
CREATE POLICY "knowledge_docs_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'knowledge-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- ============================================================
-- 8. Performance indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_tenant ON knowledge_sources(tenant_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_entries_tenant ON knowledge_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_tenant ON knowledge_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bot_instructions_tenant ON bot_instructions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_behavior_rules_tenant ON behavior_rules(tenant_id);
