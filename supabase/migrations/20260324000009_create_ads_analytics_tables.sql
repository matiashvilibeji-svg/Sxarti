-- Ads Analytics tables for Meta ad account integration

-- 1. Meta Ad Accounts (stores connected ad account info)
CREATE TABLE meta_ad_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  meta_user_id text NOT NULL,
  ad_account_id text NOT NULL,
  access_token text NOT NULL,
  account_name text,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id)
);

ALTER TABLE meta_ad_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON meta_ad_accounts
  FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- 2. Ad Campaigns
CREATE TABLE ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  ad_account_id uuid NOT NULL REFERENCES meta_ad_accounts(id) ON DELETE CASCADE,
  meta_campaign_id text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  objective text,
  daily_budget numeric,
  lifetime_budget numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, meta_campaign_id)
);

ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON ad_campaigns
  FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- 3. Ad Sets
CREATE TABLE ad_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  meta_adset_id text NOT NULL,
  name text,
  status text NOT NULL DEFAULT 'ACTIVE',
  targeting jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, meta_adset_id)
);

ALTER TABLE ad_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON ad_sets
  FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- 4. Ads
CREATE TABLE ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  adset_id uuid NOT NULL REFERENCES ad_sets(id) ON DELETE CASCADE,
  meta_ad_id text NOT NULL,
  name text,
  status text NOT NULL DEFAULT 'ACTIVE',
  creative_thumbnail_url text,
  creative_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, meta_ad_id)
);

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON ads
  FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- 5. Ad Metrics (daily aggregated performance)
CREATE TABLE ad_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  adset_id uuid REFERENCES ad_sets(id) ON DELETE CASCADE,
  ad_id uuid REFERENCES ads(id) ON DELETE CASCADE,
  date date NOT NULL,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  spend numeric(10,2) DEFAULT 0,
  conversions integer DEFAULT 0,
  reach integer DEFAULT 0,
  ctr numeric(6,4) DEFAULT 0,
  cpc numeric(10,2) DEFAULT 0,
  cpm numeric(10,2) DEFAULT 0,
  roas numeric(10,2) DEFAULT 0,
  age_breakdown jsonb,
  gender_breakdown jsonb,
  geo_breakdown jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_ad_metrics_unique ON ad_metrics (
  tenant_id, campaign_id,
  COALESCE(adset_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(ad_id, '00000000-0000-0000-0000-000000000000'::uuid),
  date
);

ALTER TABLE ad_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON ad_metrics
  FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- 6. Ad Recommendations (cached AI recommendations)
CREATE TABLE ad_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  priority text NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  category text NOT NULL CHECK (category IN ('budget', 'creative', 'audience', 'timing', 'product')),
  title text NOT NULL,
  description text NOT NULL,
  supporting_data jsonb,
  generated_at timestamptz DEFAULT now()
);

ALTER TABLE ad_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON ad_recommendations
  FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_ad_metrics_tenant_date ON ad_metrics(tenant_id, date);
CREATE INDEX idx_ad_metrics_campaign_date ON ad_metrics(campaign_id, date);
CREATE INDEX idx_ad_campaigns_tenant_status ON ad_campaigns(tenant_id, status);
CREATE INDEX idx_ad_recommendations_tenant ON ad_recommendations(tenant_id, generated_at DESC);
