# Agent 4: Dashboard Overview + Analytics Pages

## Mission

Build the Dashboard Overview and Analytics pages with charts, stat cards, and data visualizations. All UI in Georgian.

## YOUR Files (create these)

- `src/app/(dashboard)/overview/page.tsx`
- `src/app/(dashboard)/analytics/page.tsx`
- `src/components/dashboard/stat-card.tsx`
- `src/components/dashboard/revenue-chart.tsx`
- `src/components/dashboard/conversations-chart.tsx`
- `src/components/dashboard/recent-orders.tsx`
- `src/components/dashboard/attention-conversations.tsx`
- `src/components/dashboard/conversion-funnel.tsx`
- `src/components/dashboard/top-products.tsx`
- `src/components/dashboard/peak-hours-heatmap.tsx`
- `src/components/dashboard/time-period-selector.tsx`
- `src/components/dashboard/index.ts` — barrel export

## Stitch MCP — Fetch Designs First

Use `mcp__stitch__get_screen` with project_id `12084308622143530029`:

- Dashboard Overview: screen_id `981c621bee504e989f3d2a787815a562`

## Functional Requirements

### Overview Page (`/dashboard/overview`)

- **Stat Cards** (top row):
  - დღის საუბრები (Today's conversations) — count
  - დღის შეკვეთები (Today's orders) — count
  - დღის შემოსავალი (Today's revenue) — GEL formatted
  - საშუალო პასუხის დრო (Avg response time) — seconds/minutes
- **7-day trend chart** (Recharts line/area chart):
  - Conversations & orders over last 7 days
  - Revenue line overlay
- **Recent Orders** (table, last 5):
  - Order number (SX-XXXXX), customer name, total, status, date
  - Clickable → navigate to `/dashboard/orders`
- **Conversations Needing Attention** (list):
  - Conversations with `status = 'handoff'`
  - Customer name, reason, time waiting
  - "გახსნა" (Open) button

### Analytics Page (`/dashboard/analytics`)

- **Time Period Selector**: 7d / 30d / 90d buttons
- **Conversations Over Time** (Recharts bar chart)
- **Revenue Over Time** (Recharts area chart)
- **Conversion Funnel** (visual funnel):
  - საუბრები → კალათა → შეკვეთა → დადასტურება
  - (Conversations → Cart → Order → Confirmed)
- **Top Products** (ranked list with sales count and revenue)
- **Peak Hours Heatmap** (hour × day-of-week grid, color intensity = activity)
- **Human Handoff Rate** (percentage card with trend)

### Data Fetching

- Use Supabase server client for SSR data fetching
- Query `orders`, `conversations`, `messages` tables filtered by `tenant_id`
- Use `use-tenant` hook to get current tenant
- Aggregate data with SQL or JS (prefer SQL aggregations)
- Charts use Recharts library (already installed)

### Currency Formatting

- Import `formatGEL` from `src/lib/utils/currency.ts`
- All amounts displayed as "XXX ₾"

## Georgian UI Text Reference

- მიმოხილვა = Overview
- ანალიტიკა = Analytics
- დღის საუბრები = Today's conversations
- დღის შეკვეთები = Today's orders
- დღის შემოსავალი = Today's revenue
- ბოლო შეკვეთები = Recent orders
- ყურადღება საჭიროა = Needs attention
- კონვერსიის ფუნელი = Conversion funnel
- ტოპ პროდუქტები = Top products
- პიკის საათები = Peak hours

## DO NOT Touch

- Any file outside `src/app/(dashboard)/overview/`, `src/app/(dashboard)/analytics/`, `src/components/dashboard/`
- `src/app/(dashboard)/layout.tsx` — Agent 1
- `src/components/ui/*` — Agent 1

## Completion

1. Run `npm run build` — must pass
2. Commit: "feat: add dashboard overview and analytics pages with charts"
3. Output DONE
