CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) NOT NULL,
  business_name text NOT NULL,
  logo_url text,
  bot_persona_name text DEFAULT 'ანა',
  bot_tone text DEFAULT 'friendly' CHECK (bot_tone IN ('formal', 'friendly', 'casual')),
  working_hours jsonb,
  payment_details jsonb,
  facebook_page_id text,
  facebook_access_token text,
  instagram_account_id text,
  google_sheet_id text,
  notification_config jsonb,
  subscription_plan text DEFAULT 'starter' CHECK (subscription_plan IN ('starter', 'business', 'premium')),
  subscription_status text DEFAULT 'trial',
  trial_ends_at timestamptz,
  conversations_this_month int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant" ON tenants FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Users can insert own tenant" ON tenants FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can update own tenant" ON tenants FOR UPDATE USING (owner_id = auth.uid());
