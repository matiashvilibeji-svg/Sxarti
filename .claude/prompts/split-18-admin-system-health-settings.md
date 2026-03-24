# Agent 8: Admin System Health + Settings

## Context

Sxarti admin panel. This agent builds two pages:

1. `/admin/system-health` — Infrastructure monitoring dashboard
2. `/admin/settings` — Platform configuration settings

Foundation (Agent 0) already created: `system_health_checks` + `audit_log` tables, types, admin layout, middleware.

## Step 0: Fetch Stitch Designs (MUST DO FIRST)

Before writing any code, fetch the screen designs from Google Stitch MCP.

1. Use `ToolSearch` to discover available Stitch MCP tools: `query: "+stitch get screen"`
2. Use the Stitch `get_screen` tool (likely `mcp__stitch__get_screen`) with:
   - `projectId`: `"921506058610128825"`
   - **System Health Desktop:** `screenId`: `"f31ff7d416df413fb4f4dd76d49f9d85"`
   - **System Health Mobile:** `screenId`: `"7ae1b7ea4fc5444f86f63809dcb29780"`
   - **Settings Desktop:** `screenId`: `"e2e40f6a1f8a47a486450a660d4b6a5f"`
   - **Settings Mobile:** `screenId`: `"8e09a584dca1465b88b9ca664f96fa7f"`
3. Download the returned HTML and screenshot URLs using `curl -L -o`
4. Study the service grid layout, status indicators, settings tabs, form patterns
5. Match the implementation to the Stitch designs as closely as possible

## YOUR Files (create only — all new)

---

## Part A: System Health (`/admin/system-health`)

### 1. `src/app/admin/system-health/page.tsx`

Server component:

- Fetches latest health check per service from `system_health_checks`
- Fetches recent audit log entries
- Computes overall system status

### 2. `src/components/admin/system-health/overall-status.tsx`

Large status banner:

- Overall status: "All Systems Operational" (green) / "Partial Degradation" (yellow) / "Major Outage" (red)
- Last checked timestamp
- Uptime percentage (last 30 days calculated from health checks)

### 3. `src/components/admin/system-health/service-grid.tsx`

Grid of service status cards. Services to monitor:

- **Supabase Database** — DB connectivity and response time
- **Supabase Auth** — Authentication service
- **Supabase Storage** — File storage
- **AI Bot (Gemini)** — AI response capability
- **Facebook Webhooks** — Webhook delivery
- **Instagram Webhooks** — Webhook delivery
- **Edge Functions** — Serverless functions
- **Google Sheets Sync** — Sheet sync service

Each card shows:

- Service name + icon
- Status indicator (green/yellow/red dot)
- Response time (ms)
- Last checked time
- Sparkline of response times (last 24h, simple CSS bars)

### 4. `src/components/admin/system-health/response-time-chart.tsx`

Chart showing response time trends:

- One line per service over last 24 hours
- Highlight threshold lines (good < 200ms, warning < 500ms, critical > 500ms)

### 5. `src/components/admin/system-health/incident-log.tsx`

Recent incidents (health checks where status != 'healthy'):

- Table: Service, Status, Response Time, Details, Time
- Filter by service, status
- Last 50 entries

### 6. `src/components/admin/system-health/audit-trail.tsx`

Recent admin actions from audit_log:

- Admin name, Action, Resource, Details, Time
- Filter by admin, action type
- Paginated (20 per page)

---

## Part B: Settings (`/admin/settings`)

### 7. `src/app/admin/settings/page.tsx`

Client component with tabs:

- General, Team, Notifications, Security

### 8. `src/components/admin/settings/general-settings.tsx`

Platform configuration:

- Platform Name (text input)
- Support Email (text input)
- Default Language (select)
- Maintenance Mode (toggle + message input)
- Conversation Limits per plan:
  - Starter: input (default 100)
  - Business: input (default 500)
  - Premium: input (default 2000)
- Save button

### 9. `src/components/admin/settings/team-settings.tsx`

Admin team management:

- Table of admin_users: Name, Email, Role, Status, Last Login, Actions
- Invite Admin button → modal with email, role selector
- Actions per admin: Change Role, Deactivate, Remove
- Role descriptions: super_admin (full access), admin (manage everything), support (tickets + businesses), viewer (read-only)

### 10. `src/components/admin/settings/notification-settings.tsx`

Alert configuration:

- New ticket notifications (toggle + channel selector)
- System health alerts (toggle + severity threshold)
- New business signup notifications (toggle)
- Subscription changes (toggle)
- Daily digest email (toggle + time selector)
- Notification channels: email, telegram, slack webhook URL

### 11. `src/components/admin/settings/security-settings.tsx`

Security configuration:

- Require 2FA for admins (toggle)
- Session timeout (select: 1h, 4h, 8h, 24h)
- IP whitelist (textarea, one per line)
- API rate limiting (toggle + requests/minute input)
- Audit log retention (select: 30, 60, 90, 365 days)

### 12. `src/components/admin/settings/invite-admin-modal.tsx`

Dialog for inviting a new admin:

- Email input
- Role selector (admin, support, viewer — super_admin only settable by existing super_admins)
- Send Invite button

## Design Notes

- System Health: use clear color coding (green/yellow/red) for immediate visual status
- Settings: use tabbed interface, each tab is its own form with independent save
- Mobile: services grid becomes 1 column, settings tabs become vertical list
- Use existing UI components (Card, Badge, Tabs, Input, Switch, Select, Dialog, Table)

## DO NOT TOUCH

- Any files outside `src/app/admin/system-health/`, `src/app/admin/settings/`, `src/components/admin/system-health/`, `src/components/admin/settings/`
- Database migrations, types files, middleware, layout, other admin pages

## Verification

Run `npm run build`. Commit: "feat(admin): add system health monitoring and platform settings pages"
Output DONE when build passes.
