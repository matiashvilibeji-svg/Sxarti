# Agent 4: Admin Bot Monitor

## Context

Sxarti admin panel. This page at `/admin/bot-monitor` lets platform admins monitor AI bot performance across all tenant businesses.
The AI bot uses Google Gemini to handle sales conversations in Georgian via Facebook Messenger and Instagram DMs.
Foundation (Agent 0) already created: database tables, types, admin layout, middleware.

## Step 0: Fetch Stitch Designs (MUST DO FIRST)

Before writing any code, fetch the screen designs from Google Stitch MCP.

1. Use `ToolSearch` to discover available Stitch MCP tools: `query: "+stitch get screen"`
2. Use the Stitch `get_screen` tool (likely `mcp__stitch__get_screen`) with:
   - `projectId`: `"921506058610128825"`
   - **Desktop:** `screenId`: `"f3868ba973a3454fb9d512c594113451"` (Bot Monitor)
   - **Mobile:** `screenId`: `"ead5a74a0b094bc5bfbe24f94eafe428"` (Bot Monitor Mobile)
3. Download the returned HTML and screenshot URLs using `curl -L -o`
4. Study the monitoring dashboard layout, chart types, status indicators, activity feeds
5. Match the implementation to the Stitch design as closely as possible

## YOUR Files (create only — all new)

### 1. `src/app/admin/bot-monitor/page.tsx`

Server component that fetches cross-tenant bot metrics using service role client:

- Conversation stats from `conversations` table
- Message volume from `messages` table
- Bot response patterns (sender='bot' messages)
- Handoff rates (status='handoff' conversations)

### 2. `src/components/admin/bot-monitor/bot-stats-grid.tsx`

KPI cards row:

- Total Active Conversations (status='active')
- Bot Response Rate (% of conversations fully handled by bot)
- Handoff Rate (% conversations where status='handoff')
- Average Messages per Conversation
- Total Messages Today
- Conversations Requiring Attention (handoff + not yet picked up by human)

### 3. `src/components/admin/bot-monitor/conversation-volume-chart.tsx`

Line chart showing:

- Daily conversation volume (last 30 days)
- Split by platform (messenger vs instagram)
- Overlaid handoff rate trend

### 4. `src/components/admin/bot-monitor/tenant-bot-table.tsx`

Table showing per-tenant bot performance:

- Business Name
- Active Conversations
- Total Conversations (this month)
- Bot Resolution Rate (% completed without handoff)
- Avg Messages per Conversation
- Last Conversation Time
- Status indicator (green=active, yellow=slow, red=issues)

Supports: search, sort, pagination

### 5. `src/components/admin/bot-monitor/handoff-reasons.tsx`

Breakdown of why conversations get handed off:

- Bar chart of handoff_reason values
- Top 5 reasons with counts
- Trend vs previous period

### 6. `src/components/admin/bot-monitor/conversation-stages.tsx`

Funnel/sankey visualization showing conversation stage distribution:

- greeting → product_browsing → cart → checkout → completed
- Drop-off rates at each stage
- Current stage distribution across all active conversations

### 7. `src/components/admin/bot-monitor/platform-breakdown.tsx`

Side-by-side comparison:

- Messenger vs Instagram metrics
- Conversation volume, completion rate, avg duration
- Platform-specific issues

### 8. `src/components/admin/bot-monitor/live-activity-feed.tsx`

Real-time feed (or recent activity):

- Latest conversations started (last 20)
- Latest handoffs
- Shows: business name, platform, customer name, stage, time

## Design Notes

- Use color coding: green=healthy, yellow=warning, red=critical
- Charts use CSS-based bars (no heavy libraries)
- Mobile: stack all cards and charts vertically
- All text in English

## DO NOT TOUCH

- Any files outside `src/app/admin/bot-monitor/` and `src/components/admin/bot-monitor/`
- Database migrations, types files, middleware, layout, other admin pages

## Verification

Run `npm run build`. Commit: "feat(admin): add bot monitor page with performance metrics"
Output DONE when build passes.
