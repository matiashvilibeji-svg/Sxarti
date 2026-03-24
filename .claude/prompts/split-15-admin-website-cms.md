# Agent 5: Admin Website CMS

## Context

Sxarti admin panel. This page at `/admin/cms` lets platform admins manage the public marketing website content.
Foundation (Agent 0) already created: `cms_pages` table, types (`CmsPage`, `CmsBlock`), admin layout, middleware.

CMS block types: hero, text, image, cta, features, testimonials, pricing, faq.

## Step 0: Fetch Stitch Designs (MUST DO FIRST)

Before writing any code, fetch the screen designs from Google Stitch MCP.

1. Use `ToolSearch` to discover available Stitch MCP tools: `query: "+stitch get screen"`
2. Use the Stitch `get_screen` tool (likely `mcp__stitch__get_screen`) with:
   - `projectId`: `"921506058610128825"`
   - **Desktop:** `screenId`: `"2a8f4a5a6e8a462885d0a5db80660313"` (Website CMS)
   - **Mobile:** `screenId`: `"19351bdda31f42228b8d7d93bbc1c49c"` (Website CMS Mobile)
3. Download the returned HTML and screenshot URLs using `curl -L -o`
4. Study the page list layout, block editor design, settings panel, block type cards
5. Match the implementation to the Stitch design as closely as possible

## YOUR Files (create only — all new)

### 1. `src/app/admin/cms/page.tsx`

Server component — CMS page listing:

- Fetches all cms_pages using service role client
- Shows table of pages with title, slug, status, last updated, author
- "New Page" button at top

### 2. `src/app/admin/cms/[slug]/page.tsx`

Server component — individual page editor:

- Fetches page by slug
- Renders the block editor
- Save/Publish/Archive actions

### 3. `src/components/admin/cms/page-list.tsx`

Client component — pages table:

- Columns: Title, Slug, Status (badge: draft=gray, published=green, archived=red), Updated At, Author
- Actions: Edit, Duplicate, Archive, Delete
- Filter by status
- Search by title

### 4. `src/components/admin/cms/block-editor.tsx`

Client component — the main content editor:

- Renders blocks in order
- Each block is editable inline
- Drag to reorder blocks (or up/down buttons)
- Add block button between/after blocks
- Delete block button per block
- Block type selector when adding new block

### 5. `src/components/admin/cms/blocks/hero-block.tsx`

Editable hero block:

- Headline (text input)
- Subheadline (text input)
- CTA button text + URL
- Background image URL

### 6. `src/components/admin/cms/blocks/text-block.tsx`

Rich text block:

- Textarea for content (markdown or plain text)
- Alignment selector (left, center, right)

### 7. `src/components/admin/cms/blocks/image-block.tsx`

Image block:

- Image URL input
- Alt text input
- Caption (optional)
- Width selector (full, medium, small)

### 8. `src/components/admin/cms/blocks/cta-block.tsx`

Call-to-action block:

- Headline
- Description
- Button text + URL
- Style variant (primary, secondary, gradient)

### 9. `src/components/admin/cms/blocks/features-block.tsx`

Features grid:

- Array of feature items (icon, title, description)
- Add/remove feature items
- 2-3 column layout options

### 10. `src/components/admin/cms/blocks/pricing-block.tsx`

Pricing table block:

- 3 plan columns (starter, business, premium)
- Each with: name, price (₾), features list, CTA button
- Highlight toggle for recommended plan

### 11. `src/components/admin/cms/page-settings-panel.tsx`

Side panel for page metadata:

- Slug (auto-generated from title, editable)
- Meta title (SEO)
- Meta description (SEO)
- Status selector
- Publish/Unpublish button
- Last saved indicator

### 12. `src/components/admin/cms/block-type-selector.tsx`

Dropdown/popover to pick block type when adding new block. Shows icon + name for each type.

## Design Notes

- Editor should feel like a lightweight page builder
- Use drag handle icon for reorder, trash icon for delete
- Preview button could show content in a new tab (stretch goal)
- Mobile: editor works but optimized for desktop
- Use existing UI components (Card, Input, Textarea, Button, Select, Dialog)

## DO NOT TOUCH

- Any files outside `src/app/admin/cms/` and `src/components/admin/cms/`
- Database migrations, types files, middleware, layout, other admin pages

## Verification

Run `npm run build`. Commit: "feat(admin): add website CMS with block-based page editor"
Output DONE when build passes.
