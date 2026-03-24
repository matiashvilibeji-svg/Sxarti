## Task: Redesign Step 4 (Delivery Zones) to Match Stitch Design

### Context

File: `src/app/(onboarding)/step-4/page.tsx`
The current page is functional but visually basic. The Stitch design (see `.stitch-designs/step4-delivery-zones.png` and `.html`) introduces a significantly improved layout.

### Design Changes (Current → New)

**1. Layout: Single column → 2-column grid (lg:grid-cols-12)**

- Left column (lg:col-span-8): Form + Quick suggestions + Zones table
- Right column (lg:col-span-4, sticky top-24): AI tip card + Georgia map placeholder

**2. Add Zone Form: Toggle-hidden → Always visible card**

- Remove the showForm toggle pattern
- Always show a white card with uppercase section title "ახალი ზონის დამატება"
- 3-column grid (md:grid-cols-3): zone_name, fee (with ₾ suffix inside input), estimated_days
- Purple gradient submit button aligned right
- When editing, repurpose this same form (change button text to "განახლება" + show cancel)

**3. NEW: Quick Suggestion Chips (below form)**

- Horizontal flex-wrap row of pill buttons
- Label: "სწრაფი დამატება"
- Each chip = preset zone: "თბილისი (ცენტრი) · 5₾ · 1 დღე", "ბათუმი · 12₾ · 2-3 დღე", "ქუთაისი · 10₾ · 2 დღე", "რეგიონები · 15₾ · 3-5 დღე"
- On click: insert that zone directly into DB (skip form fill)
- Once a zone with matching name exists, hide/disable that chip

**4. Zones Table: Improved styling**

- Header bar with "არსებული ზონები" title + green badge showing active count "N აქტიური"
- Table columns: ზონა, საფასური, ვადა, მოქმედებები (right-aligned)
- Row hover effect
- Edit: blue/primary icon button
- Delete: red/error icon button

**5. NEW: Right Sidebar**

- AI tip card: purple-tinted bg, left border accent, sparkle icon, Georgian tip text about free delivery threshold
- Below: "ლოგისტიკის რუკა" card with a gray placeholder div (aspect-square) and centered "აქტიური ზონები" badge overlay
- No actual map API needed — static placeholder only

**6. Footer Navigation: CardFooter → Fixed bottom bar**

- Fixed to bottom of viewport with glass-blur background
- Left: "უკან" with back arrow
- Center (hidden on mobile): "შემდეგი ნაბიჯი" / "გადახდის დეტალები"
- Right: validation indicator "მინიმუმ 1 ზონა აუცილებელია" (green check when at least 1 zone) + "გაგრძელება" gradient button
- Disable "გაგრძელება" if zones.length === 0

**7. Page Header: Card-wrapped → Standalone**

- Remove Card wrapper, use standalone h1 + subtitle
- Title: "მიტანის ზონები" (text-3xl font-bold)
- Subtitle: "განსაზღვრეთ სად მიაწვდით პროდუქტებს და რა ღირს მიტანა"

### Keep Unchanged

- Progress stepper (already matches design closely)
- All Supabase logic (loadZones, handleAddOrUpdate, handleDelete, DEFAULT_ZONES seeding)
- Zod validation schema
- All hooks and imports that are still needed
- DeliveryZone type, formatGEL utility

### Technical Notes

- Use existing Tailwind theme colors (surface-container-low, primary, etc.) — they already match the design
- Use lucide-react icons (Sparkles for AI tip, Edit2, Trash2, ChevronLeft, ChevronRight, Plus, Check)
- Add padding-bottom (pb-32) to main content to account for fixed footer
- Keep the component in a single file — no extraction needed
- Responsive: On mobile, the 2-column grid collapses to single column, right sidebar stacks below

### Verification

- `npm run build` must pass with no errors
- Visual check: the page should closely match the Stitch screenshot
- All CRUD operations (add, edit, delete zones) must still work
- Quick suggestion chips must insert zones and hide used ones
- Footer validation must reflect zone count in real-time
