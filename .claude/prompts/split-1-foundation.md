# Agent 1: Foundation & Design System

## Mission

Initialize the entire Sxarti project from scratch. Set up all configs, shared components, Supabase schema, TypeScript types, utility libraries, and layout shells. This is the foundation everything else builds on.

## YOUR Files (create all of these)

### Project Configuration

- `package.json` — All dependencies (see below)
- `tsconfig.json` — TypeScript strict mode
- `next.config.js` — Next.js 14 App Router config
- `tailwind.config.ts` — Design tokens from Stitch
- `postcss.config.js` — PostCSS with Tailwind
- `.env.local.example` — All env vars documented
- `components.json` — shadcn/ui config

### Styles

- `src/styles/globals.css` — Tailwind directives + Georgian font imports + CSS custom properties

### Root & Layouts

- `src/app/layout.tsx` — Root layout with Georgian font stack, metadata
- `src/app/page.tsx` — Redirect to /login or /dashboard/overview based on auth
- `src/app/(auth)/layout.tsx` — Centered auth layout (no sidebar)
- `src/app/(onboarding)/layout.tsx` — Onboarding wizard layout (progress bar, no sidebar)
- `src/app/(dashboard)/layout.tsx` — Dashboard shell with sidebar + navbar
- `src/app/(marketing)/layout.tsx` — Marketing layout (public navbar + footer)

### Supabase Client Libraries

- `src/lib/supabase/client.ts` — Browser client (createBrowserClient)
- `src/lib/supabase/server.ts` — Server client (createServerClient with cookies)
- `src/lib/supabase/admin.ts` — Service role client (for webhooks/edge functions)
- `src/lib/supabase/middleware.ts` — Auth session refresh middleware helper

### Next.js Middleware

- `src/middleware.ts` — Auth check: redirect unauthenticated users to /login, redirect authenticated to /dashboard/overview

### TypeScript Types

- `src/types/database.ts` — All Supabase table types (Tenant, Product, DeliveryZone, Conversation, Message, Order, FAQ)
- `src/types/index.ts` — Re-export all types

### shadcn/ui Components (customized to Stitch Design System)

Before building these, **fetch the Design System screen** using Stitch MCP:

- Tool: `get_screen` with screen_id: `asset-stub-assets-898f50d916c44f86ae575adfc3ad788b-1774205211886`
- Then fetch Component Library: screen_id: `f92a82054d3b4265b6e526e6c705c4c8`

Create these shadcn/ui components (customized with Stitch tokens):

- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/avatar.tsx`
- `src/components/ui/separator.tsx`
- `src/components/ui/skeleton.tsx`
- `src/components/ui/toast.tsx` + `toaster.tsx` + `use-toast.ts`
- `src/components/ui/scroll-area.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/tooltip.tsx`

### Shared Components

Fetch Dashboard Overview screen (screen_id: `981c621bee504e989f3d2a787815a562`) for sidebar/navbar design:

- `src/components/shared/sidebar.tsx` — Dashboard sidebar with Georgian nav labels (მიმოხილვა, საუბრები, შეკვეთები, პროდუქტები, ანალიტიკა, პარამეტრები)
- `src/components/shared/navbar.tsx` — Top bar with business name, user avatar, notifications bell
- `src/components/shared/logo.tsx` — Sxarti logo component
- `src/components/shared/loading.tsx` — Loading spinner
- `src/components/shared/empty-state.tsx` — Empty state component with Georgian text

### Utility Libraries

- `src/lib/utils/currency.ts` — GEL formatting: `formatGEL(amount: number): string` → "XXX ₾"
- `src/lib/utils/delivery.ts` — Delivery fee calculation helper
- `src/lib/utils.ts` — cn() helper for className merging (tailwind-merge + clsx)

### Custom Hooks

- `src/hooks/use-tenant.ts` — Get current user's tenant from Supabase
- `src/hooks/use-supabase.ts` — Supabase client hook for client components

### Supabase Migrations

Create in `supabase/migrations/` (use timestamped filenames):

**Migration 001: tenants table**

```sql
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
```

**Migration 002: products table** (with RLS)
**Migration 003: delivery_zones table** (with RLS)
**Migration 004: conversations table** (with RLS)
**Migration 005: messages table** (with RLS)
**Migration 006: orders table** (with RLS)
**Migration 007: faqs table** (with RLS)

Follow the exact schema from `FIrst Prompt.md`. Every table gets RLS policies using:

```sql
USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()))
```

Also create:

- `supabase/config.toml` — Local dev config
- `supabase/seed.sql` — Georgian test data (2 tenants, 5 products each, delivery zones for Tbilisi)

### Dependencies to Install

```json
{
  "dependencies": {
    "next": "14.2.x",
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "^0.5",
    "react": "^18",
    "react-dom": "^18",
    "recharts": "^2",
    "lucide-react": "latest",
    "clsx": "^2",
    "tailwind-merge": "^2",
    "class-variance-authority": "^0.7",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-dropdown-menu": "latest",
    "@radix-ui/react-select": "latest",
    "@radix-ui/react-tabs": "latest",
    "@radix-ui/react-tooltip": "latest",
    "@radix-ui/react-label": "latest",
    "@radix-ui/react-avatar": "latest",
    "@radix-ui/react-separator": "latest",
    "@radix-ui/react-scroll-area": "latest",
    "@radix-ui/react-slot": "latest",
    "zod": "^3",
    "@google/generative-ai": "latest",
    "date-fns": "^3"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "tailwindcss": "^3",
    "postcss": "^8",
    "autoprefixer": "^10",
    "eslint": "^8",
    "eslint-config-next": "14.2.x"
  }
}
```

## DO NOT Touch (owned by other agents)

- `src/app/(auth)/login/` — Agent 2
- `src/app/(auth)/signup/` — Agent 2
- `src/app/(onboarding)/step-*/` — Agent 3
- `src/app/(onboarding)/complete/` — Agent 3
- `src/app/(dashboard)/overview/page.tsx` — Agent 4
- `src/app/(dashboard)/analytics/` — Agent 4
- `src/components/dashboard/` — Agent 4
- `src/app/(dashboard)/products/page.tsx` — Agent 5
- `src/app/(dashboard)/orders/page.tsx` — Agent 5
- `src/components/products/` — Agent 5
- `src/app/(dashboard)/conversations/page.tsx` — Agent 6
- `src/app/(dashboard)/settings/page.tsx` — Agent 6
- `src/components/chat/` — Agent 6
- `src/lib/ai/` — Agent 7
- `src/lib/facebook/` — Agent 7
- `src/lib/instagram/` — Agent 7
- `src/app/api/` — Agent 7
- `src/lib/utils/georgian.ts` — Agent 7
- `src/lib/notifications/` — Agent 8
- `src/lib/sheets/` — Agent 8
- `supabase/functions/` — Agent 8
- `src/app/(marketing)/page.tsx` — Agent 8

## Stitch MCP Workflow

1. Use `mcp__stitch__get_screen` with project_id `12084308622143530029` and screen_id `asset-stub-assets-898f50d916c44f86ae575adfc3ad788b-1774205211886` to get Design System tokens
2. Extract colors, typography, spacing, border-radius, shadows into `tailwind.config.ts`
3. Use `mcp__stitch__get_screen` with screen_id `f92a82054d3b4265b6e526e6c705c4c8` for Component Library
4. Use `mcp__stitch__get_screen` with screen_id `981c621bee504e989f3d2a787815a562` for Dashboard shell (sidebar/navbar)

## Georgian Typography

```css
font-family: "BPG Arial", "Noto Sans Georgian", "DejaVu Sans", sans-serif;
```

## Completion

1. Run `npm run build` — must pass with zero errors
2. Commit with message: "feat: initialize Sxarti foundation — configs, design system, shared components, Supabase schema, types, layouts"
3. Output DONE when build passes
