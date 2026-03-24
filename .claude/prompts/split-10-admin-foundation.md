# Agent 0: Admin Foundation — Database, Types, Middleware, Layout

## IMPORTANT: This agent MUST run FIRST before all other admin agents (split-11 through split-18)

## Context

Sxarti is a multi-tenant AI sales bot SaaS. The existing `/dashboard/*` routes serve business owners (tenants).
We are building a **platform admin panel** at `/admin/*` for Sxarti platform operators to manage tenants, subscriptions, bots, support, CMS, feature flags, and system health.

## Step 0: Fetch Stitch Designs (MUST DO FIRST)

Before writing any code, fetch the Design System screen from Stitch to understand the visual language.

1. Use `ToolSearch` to discover available Stitch MCP tools: `query: "+stitch get screen"`
2. Use the Stitch `get_screen` tool (likely `mcp__stitch__get_screen`) with:
   - `projectId`: `"921506058610128825"`
   - `screenId`: `"asset-stub-assets-9efaf5a4eb4444b9845c0c8825012b26-1774256526149"` (Design System)
3. Download the returned HTML and screenshot URLs using `curl -L`
4. Study the design tokens, colors, typography, spacing, and component patterns
5. Apply these design conventions to the admin layout, sidebar, navbar, and stat card

## YOUR Files (create/modify)

### 1. Database Migration: `supabase/migrations/20260323000011_create_admin_tables.sql`

Create ALL admin tables in a single migration:

```sql
-- ============================================================
-- Admin Platform Tables for Sxarti
-- ============================================================

-- 1. admin_users: Platform admin accounts
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'admin', 'support', 'viewer')),
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. support_tickets: Support ticket system
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  assigned_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT CHECK (category IN ('billing', 'technical', 'bot', 'account', 'feature_request', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- 3. support_ticket_messages: Ticket conversation thread
CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('admin', 'tenant')),
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. feature_flags: Feature flag definitions
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  targeting JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. cms_pages: Website content management
CREATE TABLE IF NOT EXISTS cms_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '[]',
  meta_title TEXT,
  meta_description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  author_id UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. system_health_checks: Health monitoring snapshots
CREATE TABLE IF NOT EXISTS system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  response_time_ms INTEGER,
  details JSONB DEFAULT '{}',
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. audit_log: Admin action trail
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_support_tickets_tenant ON support_tickets(tenant_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_ticket_messages_ticket ON support_ticket_messages(ticket_id);
CREATE INDEX idx_feature_flags_key ON feature_flags(key);
CREATE INDEX idx_cms_pages_slug ON cms_pages(slug);
CREATE INDEX idx_cms_pages_status ON cms_pages(status);
CREATE INDEX idx_system_health_checks_service ON system_health_checks(service_name, checked_at DESC);
CREATE INDEX idx_audit_log_admin ON audit_log(admin_id, created_at DESC);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);

-- RLS Policies (admin tables use service role, no row-level tenant filtering)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Admin users can read their own record
CREATE POLICY "admin_users_self_read" ON admin_users
  FOR SELECT USING (auth.uid() = user_id);

-- Admin users can read all admin tables (checked via function)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid() AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "admin_full_access_tickets" ON support_tickets
  FOR ALL USING (is_admin());
CREATE POLICY "admin_full_access_ticket_messages" ON support_ticket_messages
  FOR ALL USING (is_admin());
CREATE POLICY "admin_full_access_feature_flags" ON feature_flags
  FOR ALL USING (is_admin());
CREATE POLICY "admin_full_access_cms" ON cms_pages
  FOR ALL USING (is_admin());
CREATE POLICY "admin_read_health" ON system_health_checks
  FOR SELECT USING (is_admin());
CREATE POLICY "admin_read_audit" ON audit_log
  FOR SELECT USING (is_admin());

-- Tenants can read/create their own tickets
CREATE POLICY "tenant_own_tickets" ON support_tickets
  FOR SELECT USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "tenant_create_tickets" ON support_tickets
  FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "tenant_own_ticket_messages" ON support_ticket_messages
  FOR ALL USING (
    ticket_id IN (
      SELECT st.id FROM support_tickets st
      JOIN tenants t ON st.tenant_id = t.id
      WHERE t.owner_id = auth.uid()
    )
  );

-- Generate ticket number function
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 'TK-' || LPAD(nextval('ticket_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1000;
CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();
```

### 2. Types: `src/types/admin.ts` (NEW FILE)

```typescript
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
```

### 3. Modify: `src/middleware.ts`

Add admin route protection. The key change: add `/admin` to protected routes and check admin_users table for admin routes.

```typescript
// Add this after the existing dashboard onboarding check:

// Admin route protection: check admin_users table
if (user && pathname.startsWith("/admin")) {
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("id, role, is_active")
    .eq("user_id", user.id)
    .single();

  if (!adminUser || !adminUser.is_active) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard/overview";
    return NextResponse.redirect(dashboardUrl);
  }
}
```

Also add `/admin` to isProtectedRoute:

```typescript
const isProtectedRoute =
  pathname.startsWith("/dashboard") ||
  pathname.startsWith("/admin") ||
  pathname.startsWith("/step-") ||
  pathname === "/complete";
```

### 4. Admin Layout: `src/app/admin/layout.tsx` (NEW)

Server component layout with admin sidebar and navbar. Use the same Material Design 3 surface colors but with a distinct admin color accent. Include:

- Left sidebar (w-64) with admin navigation items
- Top navbar (h-16) with admin user info and notifications bell
- Main content area

### 5. Admin Sidebar: `src/components/admin/admin-sidebar.tsx` (NEW)

Client component with navigation items:

- Dashboard Overview → `/admin/overview` (LayoutDashboard icon)
- Businesses → `/admin/businesses` (Building2 icon)
- Subscriptions → `/admin/billing` (CreditCard icon)
- Bot Monitor → `/admin/bot-monitor` (Bot icon)
- CMS → `/admin/cms` (FileText icon)
- Feature Flags → `/admin/feature-flags` (ToggleLeft icon)
- Support → `/admin/support` (LifeBuoy icon)
- System Health → `/admin/system-health` (Activity icon)
- Settings → `/admin/settings` (Settings icon)

Use the same sidebar pattern as `src/components/shared/sidebar.tsx` but with admin nav items.
Use English labels (admin panel is for platform operators, not Georgian business owners).

### 6. Admin Navbar: `src/components/admin/admin-navbar.tsx` (NEW)

Client component similar to `src/components/shared/navbar.tsx` but shows:

- "Sxarti Admin" title on left
- Search bar in center
- Notification bell + admin avatar/name on right

### 7. Admin Redirect: `src/app/admin/page.tsx` (NEW)

Simple redirect from `/admin` to `/admin/overview`:

```typescript
import { redirect } from "next/navigation";
export default function AdminPage() {
  redirect("/admin/overview");
}
```

### 8. Admin Auth Helper: `src/lib/admin/auth.ts` (NEW)

```typescript
import { createServerClient } from "@/lib/supabase/server";
import { AdminUser } from "@/types/admin";

export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  return data;
}

export function canManage(role: AdminUser["role"]): boolean {
  return role === "super_admin" || role === "admin";
}

export function canSupport(role: AdminUser["role"]): boolean {
  return role !== "viewer";
}
```

### 9. Shared Admin Stat Card: `src/components/admin/admin-stat-card.tsx` (NEW)

Reusable stat card component for admin dashboard. Similar to existing `src/components/dashboard/stat-card.tsx` but adapted for admin metrics.

## DO NOT TOUCH these files (owned by other agents):

- `src/app/admin/overview/*` (Agent 1)
- `src/app/admin/businesses/*` (Agent 2)
- `src/app/admin/billing/*` (Agent 3)
- `src/app/admin/bot-monitor/*` (Agent 4)
- `src/app/admin/cms/*` (Agent 5)
- `src/app/admin/feature-flags/*` (Agent 6)
- `src/app/admin/support/*` (Agent 7)
- `src/app/admin/system-health/*` or `src/app/admin/settings/*` (Agent 8)
- Any existing `src/app/dashboard/*` files
- Any existing `src/components/dashboard/*` files

## Verification

Run `npm run build`. Fix any TypeScript errors. Commit with message: "feat(admin): add foundation — database tables, types, middleware, layout"
Output DONE when build passes.
