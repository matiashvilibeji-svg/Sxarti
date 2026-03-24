## Task: Add Delivery Zones Dashboard Page + Bot Integration

### Scope (3 parts)

#### Part 1: Dashboard Page — `/dashboard/delivery-zones`

Create a new dashboard page matching the Stitch design v2 (`.stitch-designs/step4-delivery-zones-v2.png`).

**Sidebar:** Add nav item to `src/components/shared/sidebar.tsx`:

- Label: "მიწოდება"
- Icon: `Truck` (lucide-react)
- href: `/dashboard/delivery-zones`
- Position: after პროდუქტები, before ანალიტიკა

**Page file:** `src/app/dashboard/delivery-zones/page.tsx`
Follow the Products page pattern (client component, useTenant, useSupabase).

**Design from Stitch:**

- Card-based zone list (NOT table) — each zone is a row card with:
  - Left: colored icon (MapPin/Building/Waves etc) in rounded square + zone name (bold)
  - Center: fee in GEL (primary color, semibold) + estimated days
  - Right: edit button (pencil icon)
  - Alternating bg: surface-container-low / white with subtle border
  - Grid layout: grid-cols-12 (5/3/3/1)
- Header: "მიტანის ზონები" h1 + subtitle + "დაამატე ზონა" button
- Footer: AI recommendation card (purple-tinted, sparkle icon)
- Add/Edit: inline form or modal for zone CRUD
- Delete: confirmation before removing

**CRUD:** Same Supabase logic as onboarding step-4 (query delivery_zones by tenant_id).

#### Part 2: DB — Add delete RLS policy

The delivery_zones table has SELECT/INSERT/UPDATE RLS but NO DELETE policy.
Add migration and apply via Supabase MCP `apply_migration`.
Policy: Users can delete own delivery zones where tenant_id matches their tenant.

#### Part 3: Bot — Delivery zone awareness

Update the Gemini bot edge function to:

- Query `delivery_zones` for the tenant when customer asks about delivery
- Include zone names, fees, and estimated days in bot context
- Bot can answer "რა ღირს მიტანა თბილისში?" with actual data

**Files to modify:** Find the edge function that handles bot responses and add delivery zone context.

### Verification

- `npm run build` passes
- New sidebar item visible and linked
- CRUD works (add, edit, delete zones)
- RLS delete policy applied to live DB
- Bot edge function updated and deployed
