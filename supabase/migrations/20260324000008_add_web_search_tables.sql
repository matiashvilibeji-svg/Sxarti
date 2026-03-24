-- ═══════════════════════════════════════════════════════════════
-- Web Search Limits (admin-configurable rate limits per plan)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE web_search_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id TEXT NOT NULL UNIQUE CHECK (plan_id IN ('starter', 'business', 'premium')),
  monthly_limit INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default limits
INSERT INTO web_search_limits (plan_id, monthly_limit) VALUES
  ('starter', 10),
  ('business', 50),
  ('premium', -1);

-- Enable RLS
ALTER TABLE web_search_limits ENABLE ROW LEVEL SECURITY;

-- Admin can read all limits
CREATE POLICY "Admins can view all web search limits"
  ON web_search_limits FOR SELECT
  USING (is_admin());

-- Owners can read their own plan's limit
CREATE POLICY "Owners can view their plan web search limit"
  ON web_search_limits FOR SELECT
  USING (
    plan_id = (
      SELECT subscription_plan FROM tenants WHERE owner_id = auth.uid() LIMIT 1
    )
  );

-- Only admin can update limits
CREATE POLICY "Admins can update web search limits"
  ON web_search_limits FOR UPDATE
  USING (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- Web Search Usage (per-tenant monthly usage tracking)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE web_search_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, month)
);

CREATE INDEX idx_web_search_usage_tenant_month ON web_search_usage(tenant_id, month);

-- Enable RLS
ALTER TABLE web_search_usage ENABLE ROW LEVEL SECURITY;

-- Owners can read their own usage
CREATE POLICY "Owners can view their web search usage"
  ON web_search_usage FOR SELECT
  USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

-- Admin can read all usage
CREATE POLICY "Admins can view all web search usage"
  ON web_search_usage FOR SELECT
  USING (is_admin());

-- ═══════════════════════════════════════════════════════════════
-- RPC: increment_web_search_usage (SECURITY DEFINER)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION increment_web_search_usage(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan TEXT;
  v_limit INTEGER;
  v_usage INTEGER;
  v_current_month DATE;
BEGIN
  -- Get the tenant's subscription plan (caller cannot spoof)
  SELECT subscription_plan INTO v_plan
  FROM tenants
  WHERE id = p_tenant_id AND owner_id = auth.uid();

  IF v_plan IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'usage', 0, 'limit', 0);
  END IF;

  -- Get the monthly limit for this plan
  SELECT monthly_limit INTO v_limit
  FROM web_search_limits
  WHERE plan_id = v_plan;

  IF v_limit IS NULL THEN
    v_limit := 0;
  END IF;

  -- If limit is 0, web search is disabled for this plan
  IF v_limit = 0 THEN
    RETURN jsonb_build_object('allowed', false, 'usage', 0, 'limit', 0);
  END IF;

  -- Current month as first day
  v_current_month := date_trunc('month', now())::date;

  -- Upsert usage for current month
  INSERT INTO web_search_usage (tenant_id, month, usage_count, updated_at)
  VALUES (p_tenant_id, v_current_month, 1, now())
  ON CONFLICT (tenant_id, month)
  DO UPDATE SET
    usage_count = web_search_usage.usage_count + 1,
    updated_at = now()
  RETURNING usage_count INTO v_usage;

  -- Check if unlimited (-1) or within limit
  IF v_limit = -1 THEN
    RETURN jsonb_build_object('allowed', true, 'usage', v_usage, 'limit', v_limit);
  END IF;

  IF v_usage > v_limit THEN
    -- Over limit — still incremented (optimistic), but not allowed
    RETURN jsonb_build_object('allowed', false, 'usage', v_usage, 'limit', v_limit);
  END IF;

  RETURN jsonb_build_object('allowed', true, 'usage', v_usage, 'limit', v_limit);
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- Alter ai_chat_messages: add used_web_search column
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE ai_chat_messages
  ADD COLUMN used_web_search BOOLEAN NOT NULL DEFAULT false;
