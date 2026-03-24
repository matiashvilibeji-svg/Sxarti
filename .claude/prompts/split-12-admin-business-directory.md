# Agent 2: Admin Business Directory

## Context

Sxarti admin panel. This page at `/admin/businesses` lets platform admins view, search, and manage all tenant businesses.
Foundation (Agent 0) already created: database tables, types, admin layout, middleware.

## Step 0: Fetch Stitch Designs (MUST DO FIRST)

Before writing any code, fetch the screen designs from Google Stitch MCP.

1. Use `ToolSearch` to discover available Stitch MCP tools: `query: "+stitch get screen"`
2. Use the Stitch `get_screen` tool (likely `mcp__stitch__get_screen`) with:
   - `projectId`: `"921506058610128825"`
   - **Desktop:** `screenId`: `"201f77bc59cf4ef59601f74aa96ff35a"` (Business Directory)
   - **Mobile:** `screenId`: `"ebe0a4ced65b462397eff430af64e542"` (Business Directory Mobile)
3. Download the returned HTML and screenshot URLs using `curl -L -o`
4. Study the table layout, filters, card design, badges, and spacing
5. Match the implementation to the Stitch design as closely as possible

## YOUR Files (create only — all new)

### 1. `src/app/admin/businesses/page.tsx`

Server component that:

- Fetches all tenants using service role client (bypass RLS to see all tenants)
- Supports URL search params: `?search=`, `?plan=`, `?status=`, `?page=`
- Passes data to client components

**Features:**

- Search bar (business name, owner email)
- Filter by subscription plan (all, starter, business, premium)
- Filter by status (all, active, trial, expired, suspended)
- Sortable table columns (name, plan, conversations, created date)
- Pagination (20 per page)

### 2. `src/components/admin/businesses/business-table.tsx`

Client component — data table with columns:

- Business Name (with logo thumbnail)
- Owner Email
- Subscription Plan (badge: starter=gray, business=blue, premium=purple)
- Status (badge: active=green, trial=yellow, expired=red, suspended=gray)
- Conversations This Month
- Created Date
- Actions dropdown (View, Suspend/Activate, Impersonate, Delete)

### 3. `src/components/admin/businesses/business-filters.tsx`

Client component — search + filter bar:

- Text search input with debounce
- Plan dropdown filter
- Status dropdown filter
- Uses URL search params for state (useSearchParams + router.push)

### 4. `src/components/admin/businesses/business-detail-modal.tsx`

Dialog/modal showing full business details when "View" is clicked:

- Business profile (name, logo, owner, created date)
- Subscription details (plan, status, trial end, conversations used/limit)
- Connected platforms (Facebook, Instagram status)
- Bot configuration (persona name, tone)
- Recent conversations count
- Recent orders count
- Quick actions: Change plan, Extend trial, Suspend, Send notification

### 5. `src/components/admin/businesses/business-stats-bar.tsx`

Summary bar at the top showing:

- Total: X businesses
- By plan: X starter, X business, X premium
- Active trials: X (expiring this week: X)

### 6. `src/app/admin/businesses/[id]/page.tsx`

Individual business detail page (alternative to modal for full view):

- Full business profile
- Conversation history table
- Order history table
- Bot performance metrics
- Settings overview
- Action buttons

## Mobile Responsiveness

- Table switches to card layout on mobile (<768px)
- Filters collapse into a sheet/drawer on mobile
- Modal becomes full-screen on mobile

## Design Notes

- Use existing UI components (Table, Badge, Dialog, Input, Select from src/components/ui/)
- Tailwind surface tokens for backgrounds
- English labels throughout

## DO NOT TOUCH

- Any files outside `src/app/admin/businesses/` and `src/components/admin/businesses/`
- Database migrations, types files, middleware, layout

## Verification

Run `npm run build`. Commit: "feat(admin): add business directory with search, filters, and detail views"
Output DONE when build passes.
