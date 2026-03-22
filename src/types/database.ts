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

export interface Message {
  id: string;
  conversation_id: string;
  tenant_id: string;
  sender: "customer" | "bot" | "human";
  content: string;
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
