# Agent 7: Admin Support Tickets

## Context

Sxarti admin panel. This page at `/admin/support` provides a ticketing system for platform admins to handle support requests from business owners.
Foundation (Agent 0) already created: `support_tickets` + `support_ticket_messages` tables, types (`SupportTicket`, `SupportTicketMessage`), admin layout, middleware.

## Step 0: Fetch Stitch Designs (MUST DO FIRST)

Before writing any code, fetch the screen designs from Google Stitch MCP.

1. Use `ToolSearch` to discover available Stitch MCP tools: `query: "+stitch get screen"`
2. Use the Stitch `get_screen` tool (likely `mcp__stitch__get_screen`) with:
   - `projectId`: `"921506058610128825"`
   - **Desktop:** `screenId`: `"f75aadd5d1ec4bddbc2b7dad92855ae7"` (Support Tickets)
   - **Mobile:** `screenId`: `"e9d1e7fff8ba4f57aadf85bb81e3079b"` (Support Tickets Mobile)
3. Download the returned HTML and screenshot URLs using `curl -L -o`
4. Study the ticket list layout, priority/status badges, conversation thread UI, reply form
5. Match the implementation to the Stitch design as closely as possible

## YOUR Files (create only — all new)

### 1. `src/app/admin/support/page.tsx`

Server component:

- Fetches tickets with tenant info and assigned admin using service role client
- Supports URL params: `?status=`, `?priority=`, `?search=`, `?assigned=`, `?page=`
- Shows ticket list with stats bar

### 2. `src/app/admin/support/[id]/page.tsx`

Server component — individual ticket view:

- Fetches ticket details with all messages
- Renders ticket header + conversation thread + reply form

### 3. `src/components/admin/support/ticket-stats-bar.tsx`

Summary bar at top:

- Open: X (badge: blue)
- In Progress: X (badge: yellow)
- Waiting: X (badge: orange)
- Resolved Today: X (badge: green)
- Avg Response Time: Xh
- Unassigned: X (badge: red if > 0)

### 4. `src/components/admin/support/ticket-list.tsx`

Client component — ticket table/list:

- Columns: Ticket # (TK-XXXXXX), Subject, Business Name, Priority (color-coded), Status, Assigned To, Created, Last Updated
- Priority colors: critical=red, high=orange, medium=blue, low=gray
- Status badges with appropriate colors
- Click row to navigate to ticket detail
- Bulk actions: Assign, Change Status, Change Priority

### 5. `src/components/admin/support/ticket-filters.tsx`

Filter bar:

- Search (ticket number, subject, business name)
- Status filter (multi-select)
- Priority filter (multi-select)
- Assigned To filter (select admin or "Unassigned")
- Category filter
- Date range
- "Clear Filters" button

### 6. `src/components/admin/support/ticket-detail-header.tsx`

Ticket detail page header:

- Ticket number + subject
- Status badge (with change dropdown)
- Priority badge (with change dropdown)
- Assigned admin (with reassign dropdown)
- Category
- Business name (link to business detail)
- Created / Updated timestamps
- Close Ticket button

### 7. `src/components/admin/support/ticket-conversation.tsx`

Message thread:

- Chronological list of messages
- Admin messages on right (primary color bg)
- Tenant messages on left (surface color bg)
- Each message shows: sender name, content, timestamp
- Auto-scroll to bottom

### 8. `src/components/admin/support/ticket-reply-form.tsx`

Reply input at bottom:

- Textarea for message content
- "Send Reply" button
- Quick response templates dropdown (optional)
- "Close & Reply" button (sends message + closes ticket)
- Status change option alongside reply

### 9. `src/components/admin/support/create-ticket-modal.tsx`

Dialog for admins to create tickets on behalf of tenants:

- Tenant selector (search businesses)
- Subject
- Description
- Priority selector
- Category selector
- Assign to (optional)
- Create button

## Design Notes

- Ticket list should feel like an inbox — scannable and prioritized
- Conversation thread should feel like a chat interface
- Critical priority tickets should visually stand out (red border/highlight)
- Mobile: list becomes card view, detail page is full-width conversation
- Use existing UI components (Table, Badge, Dialog, Input, Textarea, Select, ScrollArea)

## DO NOT TOUCH

- Any files outside `src/app/admin/support/` and `src/components/admin/support/`
- Database migrations, types files, middleware, layout, other admin pages

## Verification

Run `npm run build`. Commit: "feat(admin): add support tickets system with conversation threads"
Output DONE when build passes.
