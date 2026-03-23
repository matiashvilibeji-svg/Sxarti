import { Tenant } from "./database";

export interface AdminUser {
  id: string;
  user_id: string;
  role: "super_admin" | "admin" | "support" | "viewer";
  display_name: string;
  avatar_url: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  tenant_id: string;
  assigned_admin_id: string | null;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "waiting" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  category:
    | "billing"
    | "technical"
    | "bot"
    | "account"
    | "feature_request"
    | "other"
    | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  tenant?: Tenant;
  assigned_admin?: AdminUser;
}

export interface SupportTicketMessage {
  id: string;
  ticket_id: string;
  sender_type: "admin" | "tenant";
  sender_id: string;
  content: string;
  created_at: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  targeting: {
    tenant_ids?: string[];
    plans?: ("starter" | "business" | "premium")[];
    percentage?: number;
  };
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  content: CmsBlock[];
  meta_title: string | null;
  meta_description: string | null;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CmsBlock {
  id: string;
  type:
    | "hero"
    | "text"
    | "image"
    | "cta"
    | "features"
    | "testimonials"
    | "pricing"
    | "faq";
  data: Record<string, unknown>;
  order: number;
}

export interface SystemHealthCheck {
  id: string;
  service_name: string;
  status: "healthy" | "degraded" | "down";
  response_time_ms: number | null;
  details: Record<string, unknown>;
  checked_at: string;
}

export interface AuditLogEntry {
  id: string;
  admin_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
  admin?: AdminUser;
}

export interface AdminDashboardStats {
  total_tenants: number;
  active_tenants: number;
  new_tenants_this_month: number;
  total_revenue: number;
  monthly_revenue: number;
  total_conversations: number;
  conversations_this_month: number;
  active_subscriptions: {
    starter: number;
    business: number;
    premium: number;
  };
  open_tickets: number;
  system_status: "healthy" | "degraded" | "down";
}

export type AdminRole = AdminUser["role"];
export type TicketStatus = SupportTicket["status"];
export type TicketPriority = SupportTicket["priority"];
export type FlagTargeting = FeatureFlag["targeting"];
