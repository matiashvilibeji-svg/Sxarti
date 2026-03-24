-- Add 'ads' as a valid source_type in knowledge_sources
-- This allows the AI assistant to include/exclude ads data from the knowledge base

ALTER TABLE knowledge_sources DROP CONSTRAINT IF EXISTS knowledge_sources_source_type_check;

ALTER TABLE knowledge_sources ADD CONSTRAINT knowledge_sources_source_type_check
  CHECK (source_type IN ('products', 'orders', 'conversations', 'faqs', 'delivery_zones', 'ads'));
