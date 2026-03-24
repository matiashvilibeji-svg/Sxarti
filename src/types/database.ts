export interface Tenant {
  id: string;
  owner_id: string;
  business_name: string;
  logo_url: string | null;
  bot_persona_name: string;
  bot_tone: "formal" | "friendly" | "casual";
  working_hours: Record<string, unknown> | null;
  payment_details: {
    bog_iban?: string;
    tbc_account?: string;
    instructions?: string;
  } | null;
  facebook_page_id: string | null;
  facebook_access_token: string | null;
  instagram_account_id: string | null;
  google_sheet_id: string | null;
  notification_config: {
    whatsapp_number?: string;
    telegram_chat_id?: string;
    preferences?: Record<string, boolean>;
  } | null;
  subscription_plan: "starter" | "business" | "premium";
  subscription_status: string;
  trial_ends_at: string | null;
  conversations_this_month: number;
  bot_response_length: number;
  bot_emoji_usage: number;
  bot_sales_aggressiveness: number;
  bot_greeting_message: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  images: string[];
  variants: ProductVariant[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  name: string;
  options: {
    value: string;
    price_modifier: number;
    stock: number;
  }[];
}

export interface DeliveryZone {
  id: string;
  tenant_id: string;
  zone_name: string;
  fee: number;
  estimated_days: string | null;
  is_active: boolean;
}

export interface Conversation {
  id: string;
  tenant_id: string;
  platform: "messenger" | "instagram";
  platform_user_id: string;
  customer_name: string | null;
  status: "active" | "handoff" | "completed" | "abandoned";
  current_stage: string;
  cart: CartItem[];
  customer_info: CustomerInfo | null;
  ai_context: Record<string, unknown> | null;
  handoff_reason: string | null;
  handed_off_at: string | null;
  started_at: string;
  last_message_at: string;
}

export interface CartItem {
  product_id: string;
  quantity: number;
  variant?: string;
}

export interface CustomerInfo {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
}

export interface MessageAttachment {
  type: "image" | "audio" | "video" | "file";
  url: string;
  mime_type: string;
  original_url?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  tenant_id: string;
  sender: "customer" | "bot" | "human";
  content: string;
  attachments: MessageAttachment[];
  platform_message_id: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  tenant_id: string;
  conversation_id: string | null;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_zone_id: string | null;
  payment_status: "pending" | "confirmed";
  delivery_status: "pending" | "shipped" | "delivered";
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  variant?: string;
}

export interface FAQ {
  id: string;
  tenant_id: string;
  question: string;
  answer: string;
  created_at: string;
}

export interface KnowledgeSource {
  id: string;
  tenant_id: string;
  source_type:
    | "products"
    | "orders"
    | "conversations"
    | "faqs"
    | "delivery_zones"
    | "ads";
  is_enabled: boolean;
  synced_count: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeEntry {
  id: string;
  tenant_id: string;
  title: string;
  content: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeDocument {
  id: string;
  tenant_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: "pdf" | "docx" | "txt";
  extracted_text: string | null;
  status: "processing" | "ready" | "error";
  created_at: string;
}

export interface BotInstruction {
  id: string;
  tenant_id: string;
  main_instruction: string;
  created_at: string;
  updated_at: string;
}

export interface BehaviorRule {
  id: string;
  tenant_id: string;
  rule_text: string;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
}

export interface AiChatSession {
  id: string;
  tenant_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AiChatMessage {
  id: string;
  session_id: string;
  tenant_id: string;
  role: "user" | "assistant";
  content: string;
  sources: { type: string; label: string; count: number }[];
  created_at: string;
}

// Ads Analytics types

export interface MetaAdAccount {
  id: string;
  tenant_id: string;
  meta_user_id: string;
  ad_account_id: string;
  access_token: string;
  account_name: string | null;
  last_synced_at: string | null;
  created_at: string;
}

export interface AdCampaign {
  id: string;
  tenant_id: string;
  ad_account_id: string;
  meta_campaign_id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";
  objective: string | null;
  daily_budget: number | null;
  lifetime_budget: number | null;
  created_at: string;
  updated_at: string;
}

export interface AdSet {
  id: string;
  tenant_id: string;
  campaign_id: string;
  meta_adset_id: string;
  name: string | null;
  status: "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";
  targeting: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Ad {
  id: string;
  tenant_id: string;
  adset_id: string;
  meta_ad_id: string;
  name: string | null;
  status: "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";
  creative_thumbnail_url: string | null;
  creative_type: "IMAGE" | "VIDEO" | "CAROUSEL" | null;
  created_at: string;
  updated_at: string;
}

export interface AdMetrics {
  id: string;
  tenant_id: string;
  campaign_id: string;
  adset_id: string | null;
  ad_id: string | null;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  reach: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
  age_breakdown: Record<string, number> | null;
  gender_breakdown: Record<string, number> | null;
  geo_breakdown: Record<string, number> | null;
  created_at: string;
}

export interface AdRecommendation {
  id: string;
  tenant_id: string;
  priority: "high" | "medium" | "low";
  category: "budget" | "creative" | "audience" | "timing" | "product";
  title: string;
  description: string;
  supporting_data: Record<string, unknown> | null;
  generated_at: string;
}
