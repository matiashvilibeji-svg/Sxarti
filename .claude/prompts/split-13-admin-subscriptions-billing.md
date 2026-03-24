# Agent 3: Admin Subscriptions & Billing

## Context

Sxarti admin panel. This page at `/admin/billing` lets platform admins manage subscription plans, view billing metrics, and handle payment-related operations.
Foundation (Agent 0) already created: database tables, types, admin layout, middleware.

Subscription tiers: Starter ₾49/mo, Business ₾149/mo, Premium ₾299/mo.

## Step 0: Fetch Stitch Designs (MUST DO FIRST)

Before writing any code, fetch the screen designs from Google Stitch MCP.

1. Use `ToolSearch` to discover available Stitch MCP tools: `query: "+stitch get screen"`
2. Use the Stitch `get_screen` tool (likely `mcp__stitch__get_screen`) with:
   - `projectId`: `"921506058610128825"`
   - **Desktop:** `screenId`: `"6975c98d8f004b8f886e94e3399be008"` (Subscriptions & Billing)
   - **Mobile:** `screenId`: `"7e7eb99696ce44a8983e3e02b5366824"` (Subscriptions & Billing Mobile)
3. Download the returned HTML and screenshot URLs using `curl -L -o`
4. Study the billing cards, chart styles, subscriber table design, plan badges
5. Match the implementation to the Stitch design as closely as possible

## YOUR Files (create only — all new)

### 1. `src/app/admin/billing/page.tsx`

Server component that fetches:

- All tenants with subscription data (using service role client)
- Aggregate revenue metrics
- Plan distribution counts

### 2. `src/components/admin/billing/billing-overview.tsx`

Top section with KPI cards:

- Monthly Recurring Revenue (MRR) in ₾
- Total Active Subscribers
- Churn Rate (% of cancelled this month)
- Average Revenue Per User (ARPU)
- Trial Conversions (% of trials that converted)
- Revenue Growth (vs last month)

### 3. `src/components/admin/billing/subscriber-table.tsx`

Client component — data table of all subscribers:

- Business Name
- Current Plan (badge colored by tier)
- Status (active, trial, expired, cancelled)
- Trial Ends At (if applicable, with days remaining)
- Conversations Used / Limit
- Monthly Amount (₾)
- Actions: Change Plan, Extend Trial, Cancel, View Details

Supports:

- Search by business name
- Filter by plan, status
- Sort by any column
- Pagination (20 per page)

### 4. `src/components/admin/billing/plan-distribution-chart.tsx`

Visual breakdown:

- Donut chart: starter vs business vs premium count
- Below: revenue contribution per plan tier
- Growth indicator per tier (new subscribers this month)

### 5. `src/components/admin/billing/revenue-chart.tsx`

Monthly revenue chart (last 12 months):

- Stacked by plan tier
- Total line overlay
- MRR trend indicator

### 6. `src/components/admin/billing/change-plan-modal.tsx`

Dialog for changing a tenant's subscription:

- Current plan display
- Plan selector (starter/business/premium)
- Effective date picker
- Reason for change (text input)
- Confirm/Cancel buttons

### 7. `src/components/admin/billing/trial-management.tsx`

Section showing:

- Active trials count and list
- Trials expiring this week
- Quick action: extend trial by 7/14/30 days
- Trial conversion funnel visualization

## Design Notes

- Use GEL (₾) for all currency. Format: `₾49`, `₾1,247`
- Color scheme: use surface tokens, primary for active, destructive for expired/cancelled
- Use existing UI components (Table, Badge, Dialog, Select, Input)
- Responsive mobile layout: tables become cards

## DO NOT TOUCH

- Any files outside `src/app/admin/billing/` and `src/components/admin/billing/`
- Database migrations, types files, middleware, layout, other admin pages

## Verification

Run `npm run build`. Commit: "feat(admin): add subscriptions & billing management page"
Output DONE when build passes.
