# Agent 1: Admin Dashboard Overview

## Context

Sxarti admin panel. This page is the main landing page for platform admins at `/admin/overview`.
The foundation (Agent 0) has already created: database tables, `src/types/admin.ts`, admin layout, sidebar, navbar, and middleware.

## Step 0: Fetch Stitch Designs (MUST DO FIRST)

Before writing any code, fetch the screen designs from Google Stitch MCP.

1. Use `ToolSearch` to discover available Stitch MCP tools: `query: "+stitch get screen"`
2. Use the Stitch `get_screen` tool (likely `mcp__stitch__get_screen`) with:
   - `projectId`: `"921506058610128825"`
   - **Desktop:** `screenId`: `"4af2a3c4baa54375a14ced3daa7fe3ea"` (Dashboard Overview)
3. Download the returned HTML and screenshot URLs using `curl -L -o`
4. Study the layout, components, chart styles, color palette, and spacing
5. Match the implementation to the Stitch design as closely as possible

## YOUR Files (create only — all new)

### 1. `src/app/admin/overview/page.tsx`

Server component that fetches platform-wide statistics using the Supabase service role client (`src/lib/supabase/admin.ts`) to bypass RLS and aggregate across all tenants.

**Stats to display (KPI cards row):**

- Total Businesses (count of tenants)
- Active Subscriptions (count where subscription_status = 'active')
- Monthly Revenue (sum based on subscription plans: starter=49, business=149, premium=299 GEL)
- Total Conversations This Month (sum of conversations_this_month across tenants)
- Open Support Tickets (count of support_tickets where status IN ('open', 'in_progress'))
- System Health (latest system_health_checks status)

**Charts/Widgets below KPI cards:**

- Revenue Trend Chart (last 6 months) — use a simple bar/line chart
- New Signups Chart (tenants by created_at, grouped by week)
- Subscription Distribution (pie/donut: starter vs business vs premium)
- Recent Activity Feed (last 10 audit_log entries)
- Conversations Volume (daily count for last 30 days)
- Top Businesses by Revenue (top 5 tenants by plan tier + conversation volume)

### 2. `src/components/admin/overview/stats-grid.tsx`

Grid of 6 KPI stat cards using `src/components/admin/admin-stat-card.tsx`.

### 3. `src/components/admin/overview/revenue-trend-chart.tsx`

Bar chart showing monthly revenue. Use a simple CSS-based chart or lightweight chart implementation (no heavy chart library needed — use divs with percentage heights).

### 4. `src/components/admin/overview/signup-chart.tsx`

Weekly new tenant signups line/bar chart.

### 5. `src/components/admin/overview/subscription-distribution.tsx`

Donut/pie showing plan distribution with counts and percentages.

### 6. `src/components/admin/overview/recent-activity.tsx`

Scrollable list of recent audit log entries with admin name, action, timestamp.

### 7. `src/components/admin/overview/top-businesses.tsx`

Table showing top 5 businesses with business name, plan, conversations this month, status.

## Design Notes

- Use existing Tailwind color tokens (surface-container-\*, primary, on-surface, etc.)
- Responsive: stack cards in 2 columns on tablet, 1 on mobile
- All text in English
- Use GEL (₾) for currency formatting
- Import types from `@/types/admin`

## DO NOT TOUCH

- Any files outside `src/app/admin/overview/` and `src/components/admin/overview/`
- `src/middleware.ts`, `src/types/*`, `src/app/admin/layout.tsx`
- Any other admin page directories

## Verification

Run `npm run build`. Commit: "feat(admin): add dashboard overview page with platform stats"
Output DONE when build passes.
