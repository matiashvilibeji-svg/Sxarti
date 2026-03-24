# Agent 6: Admin Feature Flags

## Context

Sxarti admin panel. This page at `/admin/feature-flags` lets platform admins manage feature flags to control feature rollout across tenants.
Foundation (Agent 0) already created: `feature_flags` table, types (`FeatureFlag`), admin layout, middleware.

## Step 0: Fetch Stitch Designs (MUST DO FIRST)

Before writing any code, fetch the screen designs from Google Stitch MCP.

1. Use `ToolSearch` to discover available Stitch MCP tools: `query: "+stitch get screen"`
2. Use the Stitch `get_screen` tool (likely `mcp__stitch__get_screen`) with:
   - `projectId`: `"921506058610128825"`
   - **Desktop:** `screenId`: `"15a0f6e30a6e4dc3b2e19d8c95cb8d9d"` (Feature Flags)
   - **Mobile:** `screenId`: `"589597318cc342109ac65c7dc1dcc02b"` (Feature Flags Mobile)
3. Download the returned HTML and screenshot URLs using `curl -L -o`
4. Study the flag card layout, toggle design, targeting UI, stats bar
5. Match the implementation to the Stitch design as closely as possible

## YOUR Files (create only — all new)

### 1. `src/app/admin/feature-flags/page.tsx`

Server component:

- Fetches all feature flags using service role client
- Fetches tenant count for targeting display
- Renders flag list and management UI

### 2. `src/components/admin/feature-flags/flag-list.tsx`

Client component — the main flag management interface:

- List of all feature flags as expandable cards
- Each card shows: name, key, description, enabled/disabled toggle, targeting summary
- Search by name/key
- Filter: all, enabled, disabled
- Sort: name, created date, last updated
- "Create Flag" button at top

### 3. `src/components/admin/feature-flags/flag-card.tsx`

Individual flag card (expandable):

**Collapsed view:**

- Toggle switch (on/off)
- Flag name + key (monospace)
- Brief description
- Targeting summary badge (e.g., "All tenants", "3 tenants", "Business+ plans", "50%")
- Last updated timestamp

**Expanded view (click to expand):**

- Full description (editable)
- Targeting configuration:
  - Mode: All Tenants | Specific Tenants | By Plan | Percentage Rollout
  - Specific Tenants: multi-select tenant picker
  - By Plan: checkboxes for starter/business/premium
  - Percentage: slider 0-100%
- Created by (admin name)
- Created/Updated dates
- Save / Delete buttons

### 4. `src/components/admin/feature-flags/create-flag-modal.tsx`

Dialog for creating a new flag:

- Key (auto-generated from name, snake_case, editable)
- Name
- Description
- Initial state (enabled/disabled)
- Targeting (same config as flag-card expanded)
- Create button

### 5. `src/components/admin/feature-flags/tenant-picker.tsx`

Multi-select component for picking specific tenants:

- Search tenants by name
- Show selected tenants as badges/chips
- Remove individual selections
- "Select All" / "Clear All" actions

### 6. `src/components/admin/feature-flags/flag-stats.tsx`

Top summary bar:

- Total Flags: X
- Enabled: X
- Disabled: X
- Recently Changed (last 7 days): X

## Design Notes

- Toggle switches should be prominent and clearly indicate state
- Flag keys displayed in monospace font
- Use green for enabled, muted/gray for disabled
- Cards should be scannable — most info visible without expanding
- Mobile: cards stack vertically, full-width
- Use existing UI components (Card, Switch, Dialog, Input, Badge, Select)

## DO NOT TOUCH

- Any files outside `src/app/admin/feature-flags/` and `src/components/admin/feature-flags/`
- Database migrations, types files, middleware, layout, other admin pages

## Verification

Run `npm run build`. Commit: "feat(admin): add feature flags management page"
Output DONE when build passes.
