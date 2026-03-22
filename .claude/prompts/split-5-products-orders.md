# Agent 5: Products Catalog + Orders Management

## Mission

Build the Products catalog and Orders management dashboard pages. Full CRUD for products, filterable/sortable orders table. All UI in Georgian.

## YOUR Files (create these)

- `src/app/(dashboard)/products/page.tsx`
- `src/app/(dashboard)/orders/page.tsx`
- `src/components/products/product-card.tsx`
- `src/components/products/product-grid.tsx`
- `src/components/products/product-form-modal.tsx`
- `src/components/products/stock-indicator.tsx`
- `src/components/products/image-upload.tsx`
- `src/components/products/index.ts` — barrel export

## Stitch MCP — Fetch Designs First

Use `mcp__stitch__get_screen` with project_id `12084308622143530029`:

- Products Catalog: screen_id `4a43e51446724618afc946bc86ab45ff`
- Orders Management: screen_id `210facee2385472aa0c1bd38956007e6`

## Functional Requirements

### Products Page (`/dashboard/products`)

- **Grid/List toggle** view
- **Product Card** shows:
  - Product image (first from `images[]`)
  - Name (Georgian)
  - Price in GEL (formatted with `formatGEL`)
  - Stock indicator: green (>threshold), yellow (≤threshold), red (0)
- **"პროდუქტის დამატება" (Add Product) button** → opens modal
- **Product Form Modal** (add/edit):
  - სახელი (Name) — text input
  - ფასი (Price) — number input with ₾ suffix
  - აღწერა (Description) — textarea
  - მარაგი (Stock quantity) — number input
  - მინიმალური მარაგი (Low stock threshold) — number input
  - სურათები (Images) — drag-drop upload to Supabase Storage
  - ვარიანტები (Variants) — dynamic add/remove variant rows
  - "შენახვა" (Save) and "გაუქმება" (Cancel) buttons
- **Delete** with confirmation dialog: "ნამდვილად გსურთ წაშლა?" (Are you sure?)
- **Search/filter** by product name
- Data: CRUD on `products` table, images to Supabase Storage bucket

### Orders Page (`/dashboard/orders`)

- **Filterable, sortable table**:
  - Columns: შეკვეთა # (SX-XXXXX), მომხმარებელი, ნივთები, ჯამი (₾), გადახდა, მიწოდება, თარიღი
  - (Order #, Customer, Items, Total, Payment, Delivery, Date)
- **Filters**: payment status, delivery status, date range
- **Sort**: by date, total, status
- **Click to expand** → full order detail:
  - All items with quantities and prices
  - Customer info (name, phone, address)
  - Conversation link
- **Inline status updates**:
  - Payment: pending ↔ confirmed (dropdown)
  - Delivery: pending → shipped → delivered (dropdown)
- **CSV Export button** — download current filtered view
- Data: read/update on `orders` table

### Status Badge Colors

- pending = yellow
- confirmed = green
- shipped = blue
- delivered = green

### Currency

- Import `formatGEL` from `src/lib/utils/currency.ts`
- All amounts as "XXX ₾"

## Georgian UI Text Reference

- პროდუქტები = Products
- შეკვეთები = Orders
- პროდუქტის დამატება = Add product
- რედაქტირება = Edit
- წაშლა = Delete
- მარაგში = In stock
- ამოიწურა = Out of stock
- გადახდა = Payment
- მიწოდება = Delivery
- მოლოდინში = Pending
- დადასტურებული = Confirmed
- გაგზავნილი = Shipped
- მიწოდებული = Delivered
- CSV-ის ჩამოტვირთვა = Download CSV

## DO NOT Touch

- Any file outside `src/app/(dashboard)/products/`, `src/app/(dashboard)/orders/`, `src/components/products/`
- `src/components/ui/*` — Agent 1
- `src/lib/supabase/*` — Agent 1

## Completion

1. Run `npm run build` — must pass
2. Commit: "feat: add products catalog and orders management pages"
3. Output DONE
