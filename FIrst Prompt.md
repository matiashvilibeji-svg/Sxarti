# CLAUDE.md — Sxarti (სხარტი) Development Instructions

## Project Identity

**Sxarti (სხარტი)** — AI-powered sales automation SaaS for Georgian small businesses selling through Facebook and Instagram.

- **Domain:** sxarti.ge
- **Tagline:** "Your AI Sales Assistant That Never Sleeps" / "შენი გაყიდვები არასდროს იძინებს"
- **Target users:** Product-based Georgian SMEs (electronics, clothing, furniture, cosmetics, food, handmade goods)
- **Language:** Georgian-first UI. All dashboard labels, navigation, buttons, placeholders, error messages, and empty states MUST be in Georgian.

---

## Design Source of Truth — Stitch MCP

**All UI/UX decisions are governed by the designs in the Stitch project. Never invent UI. Always pull from Stitch first.**

### Stitch Project

- **Project Title:** Sxarti Component Library სხარტი
- **Project ID:** `12084308622143530029`

### Screen Registry

Every screen has a Stitch ID. Before building a page, **fetch its design using the Stitch MCP tools** with the corresponding screen ID.

| Screen Name | Stitch Screen ID | Maps To (Route / Component) |
|---|---|---|
| Design System | `asset-stub-assets-898f50d916c44f86ae575adfc3ad788b-1774205211886` | `tailwind.config.ts`, `globals.css`, `components/ui/*` — **FETCH THIS FIRST before anything else** |
| Sxarti Component Library სხარტი | `f92a82054d3b4265b6e526e6c705c4c8` | Shared components, reusable patterns |
| Sxarti Landing Page | `7d8b52f4fa5c4136a1e07fbb25ffcb62` | `src/app/(marketing)/page.tsx` |
| Sxarti Sign Up სხარტი რეგისტრაცია | `a09e2ce39a604cc2a7dedf0bfa0e2910` | `src/app/(auth)/signup/page.tsx` |
| Sxarti Log In სხარტი შესვლა | `495832f0dc524f319dfeaf899cc852f0` | `src/app/(auth)/login/page.tsx` |
| Step 1: Business Profile | `d80473b1d5f1418b80871cb77d01f142` | `src/app/(onboarding)/step-1/page.tsx` |
| Step 2: Connect Facebook | `172a992146824e3bb93ebc0c8c7c25b4` | `src/app/(onboarding)/step-2/page.tsx` |
| Step 3: Add Products | `95c4ee1738a940fa85bebce5a7d2fe2b` | `src/app/(onboarding)/step-3/page.tsx` |
| Step 4: Delivery Zones | `53eb067ea3ae48b28171525fbb70427a` | `src/app/(onboarding)/step-4/page.tsx` |
| Step 5: Payment Details | `44bad4078b0c4c02b9b714feadbd3a70` | `src/app/(onboarding)/step-5/page.tsx` |
| Onboarding Complete | `b06b8353bb1c4922a9fff340e7be8dde` | `src/app/(onboarding)/complete/page.tsx` |
| Sxarti Dashboard Overview მიმოხილვა | `981c621bee504e989f3d2a787815a562` | `src/app/(dashboard)/overview/page.tsx` |
| Conversations Inbox | `dc45b98dd5d3443cb01b1cccb36bea8c` | `src/app/(dashboard)/conversations/page.tsx` |
| Sxarti Orders Management სხარტი - შეკვეთები | `210facee2385472aa0c1bd38956007e6` | `src/app/(dashboard)/orders/page.tsx` |
| Sxarti Products Catalog (სხარტი) | `4a43e51446724618afc946bc86ab45ff` | `src/app/(dashboard)/products/page.tsx` |
| Sxarti Settings (პარამეტრები) | `dd07670d3cd744778eded9f8b1c0e1f7` | `src/app/(dashboard)/settings/page.tsx` |

### Stitch Workflow — MANDATORY for Every UI Task

1. **Start with the Design System screen** (`asset-stub-assets-898f50d916c44f86ae575adfc3ad788b-1774205211886`) to extract colors, typography, spacing tokens, and base component styles into `tailwind.config.ts` and `globals.css`. Do this ONCE at project init.
2. **Then fetch the Component Library** (`f92a82054d3b4265b6e526e6c705c4c8`) to understand shared patterns (buttons, inputs, cards, badges, modals, sidebar, navbar).
3. **Before building any page**, fetch its specific screen from the table above using Stitch MCP tools.
4. **Download any hosted image/asset URLs** from the Stitch response using `curl -L` to save them locally into `public/` or process them as needed.
5. Match the design **pixel-perfectly**: spacing, typography, colors, border-radius, shadows, icon usage, component hierarchy, responsive breakpoints.
6. If a design is ambiguous or missing for a specific state (loading, error, empty, mobile), **ask me before improvising**.
7. **Never invent UI patterns.** If it's not in the Stitch design, don't add it. If something seems missing, flag it.

### Design-to-Code Mapping

| Design Element | Implementation |
|---|---|
| Colors & tokens | Tailwind CSS custom theme in `tailwind.config.ts` — extract from Design System screen |
| Typography scale | Tailwind font classes, Georgian font stack (see below) |
| Spacing & layout | Tailwind spacing utilities, match exact px values from Stitch |
| Components (buttons, inputs, cards, tables) | shadcn/ui components, customized to match Stitch Component Library |
| Icons | Use the icon library specified in the designs (likely Lucide) |
| Responsive behavior | Follow breakpoints from Stitch; default: mobile-first |

### Georgian Typography

```css
font-family: 'BPG Arial', 'Noto Sans Georgian', 'DejaVu Sans', sans-serif;
```

- Ensure all Georgian text renders correctly including: ა-ჰ, mixed Georgian+Latin, numbers, and special characters.
- Test with real Georgian strings, never lorem ipsum.

---

## Tech Stack (Locked — Do Not Change)

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Backend / DB / Auth / Storage / Realtime | Supabase |
| Edge Functions | Supabase Edge Functions (Deno) |
| AI Model | Gemini 2.5 Flash |
| Hosting | Vercel |
| Payments | Bank transfer (BoG / TBC) — no payment gateway integration |

---

## Project Structure

```
sxarti/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth pages (login, signup, forgot-password)
│   │   ├── (onboarding)/       # Post-signup onboarding wizard
│   │   │   ├── step-1/         # Business Profile
│   │   │   ├── step-2/         # Connect Facebook
│   │   │   ├── step-3/         # Add Products
│   │   │   ├── step-4/         # Delivery Zones
│   │   │   ├── step-5/         # Payment Details
│   │   │   └── complete/       # Onboarding complete
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   │   ├── overview/       # მიმოხილვა — daily snapshot
│   │   │   ├── conversations/  # საუბრები — inbox + chat view
│   │   │   ├── orders/         # შეკვეთები — order management
│   │   │   ├── products/       # პროდუქტები — product catalog
│   │   │   ├── analytics/      # ანალიტიკა — charts & metrics
│   │   │   └── settings/       # პარამეტრები — all configuration
│   │   ├── (marketing)/        # Public pages (landing, pricing)
│   │   ├── api/                # API routes
│   │   │   ├── webhooks/
│   │   │   │   ├── facebook/   # FB Messenger webhook
│   │   │   │   └── instagram/  # IG DM webhook
│   │   │   └── ...
│   │   ├── layout.tsx
│   │   └── page.tsx            # Landing page
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives (customized to Stitch designs)
│   │   ├── dashboard/          # Dashboard-specific components
│   │   ├── chat/               # Conversation/inbox components
│   │   ├── products/           # Product management components
│   │   └── shared/             # Shared components (navbar, sidebar, etc.)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser client
│   │   │   ├── server.ts       # Server client
│   │   │   ├── admin.ts        # Service role client
│   │   │   └── middleware.ts   # Auth middleware
│   │   ├── ai/
│   │   │   ├── gemini.ts       # Gemini 2.5 Flash client
│   │   │   ├── prompts/        # System prompts per conversation stage
│   │   │   └── pipeline.ts     # Message → AI → Response pipeline
│   │   ├── facebook/
│   │   │   ├── webhook.ts      # Webhook verification & message parsing
│   │   │   ├── messenger.ts    # Send message API
│   │   │   └── oauth.ts        # Page connection OAuth flow
│   │   ├── instagram/
│   │   │   ├── webhook.ts
│   │   │   └── messaging.ts
│   │   ├── notifications/
│   │   │   ├── whatsapp.ts     # WhatsApp notification sender
│   │   │   └── telegram.ts     # Telegram bot notifications
│   │   ├── sheets/
│   │   │   └── sync.ts         # Bidirectional Google Sheets sync
│   │   └── utils/
│   │       ├── georgian.ts     # Georgian ↔ Latin transliteration
│   │       ├── currency.ts     # GEL formatting
│   │       └── delivery.ts     # Delivery fee calculation
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript types & interfaces
│   └── styles/
│       └── globals.css         # Tailwind base + Georgian fonts
├── supabase/
│   ├── migrations/             # SQL migrations (ordered)
│   ├── functions/              # Supabase Edge Functions
│   │   ├── ai-respond/         # Process incoming message → AI response
│   │   ├── webhook-facebook/   # Facebook webhook handler
│   │   ├── sheets-sync/        # Google Sheets bidirectional sync
│   │   └── notifications/      # WhatsApp/Telegram push
│   └── seed.sql                # Dev seed data (Georgian test products)
├── public/
│   └── fonts/                  # Georgian web fonts
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
├── .env.local.example
└── package.json
```

---

## Database Schema (Supabase PostgreSQL)

### Multi-Tenancy Model

Every table has a `tenant_id` column referencing the `tenants` table. ALL queries MUST filter by `tenant_id`. Use Supabase RLS (Row Level Security) policies — never rely on application-level filtering alone.

### Core Tables

```sql
-- Tenants (businesses)
tenants (
  id uuid PK DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id),
  business_name text NOT NULL,
  logo_url text,
  bot_persona_name text DEFAULT 'ანა',
  bot_tone text DEFAULT 'friendly' CHECK (bot_tone IN ('formal', 'friendly', 'casual')),
  working_hours jsonb,
  payment_details jsonb,          -- { bog_iban, tbc_account, instructions }
  facebook_page_id text,
  facebook_access_token text,     -- encrypted
  instagram_account_id text,
  google_sheet_id text,
  notification_config jsonb,      -- { whatsapp_number, telegram_chat_id, preferences }
  subscription_plan text DEFAULT 'starter' CHECK (subscription_plan IN ('starter', 'business', 'premium')),
  subscription_status text DEFAULT 'trial',
  trial_ends_at timestamptz,
  conversations_this_month int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

-- Products
products (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  name text NOT NULL,             -- Georgian name
  description text,               -- Georgian description for AI context
  price numeric(10,2) NOT NULL,   -- GEL
  stock_quantity int DEFAULT 0,
  low_stock_threshold int DEFAULT 5,
  images text[],                  -- Array of Supabase Storage URLs
  variants jsonb,                 -- [{ name, options: [{ value, price_modifier, stock }] }]
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

-- Delivery Zones
delivery_zones (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  zone_name text NOT NULL,        -- e.g., "თბილისი (ცენტრი)"
  fee numeric(10,2) NOT NULL,     -- GEL
  estimated_days text,            -- e.g., "1" or "2-3"
  is_active boolean DEFAULT true
)

-- Conversations
conversations (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  platform text NOT NULL CHECK (platform IN ('messenger', 'instagram')),
  platform_user_id text NOT NULL, -- FB/IG user ID
  customer_name text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'handoff', 'completed', 'abandoned')),
  current_stage text DEFAULT 'greeting',
  -- Stages: greeting, needs_assessment, product_presentation, upsell, cart_review,
  --         info_collection, delivery_calculation, order_confirmation, complete
  cart jsonb DEFAULT '[]',        -- [{ product_id, quantity, variant }]
  customer_info jsonb,            -- { name, phone, address, city }
  ai_context jsonb,               -- Running context for Gemini
  handoff_reason text,
  handed_off_at timestamptz,
  started_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now()
)

-- Messages
messages (
  id uuid PK DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) NOT NULL,
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  sender text NOT NULL CHECK (sender IN ('customer', 'bot', 'human')),
  content text NOT NULL,
  platform_message_id text,
  created_at timestamptz DEFAULT now()
)

-- Orders
orders (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  conversation_id uuid REFERENCES conversations(id),
  order_number text NOT NULL UNIQUE, -- SX-XXXXX format
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text NOT NULL,
  items jsonb NOT NULL,           -- [{ product_id, name, quantity, unit_price, variant }]
  subtotal numeric(10,2) NOT NULL,
  delivery_fee numeric(10,2) NOT NULL,
  total numeric(10,2) NOT NULL,
  delivery_zone_id uuid REFERENCES delivery_zones(id),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed')),
  delivery_status text DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'shipped', 'delivered')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

-- FAQ (custom per tenant)
faqs (
  id uuid PK DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamptz DEFAULT now()
)
```

### RLS Policies

```sql
-- Example for products (apply similar pattern to ALL tenant-scoped tables)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant products"
  ON products FOR SELECT
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert own tenant products"
  ON products FOR INSERT
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update own tenant products"
  ON products FOR UPDATE
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- Service role bypasses RLS for webhook/edge function operations
```

---

## AI Sales Bot Pipeline

### Message Flow

```
Customer sends FB/IG message
  → Facebook/Instagram Webhook (POST /api/webhooks/facebook)
  → Identify tenant by page_id
  → Load or create conversation
  → Build AI context:
      - Tenant's products (active, in-stock)
      - Delivery zones & fees
      - Payment details
      - FAQ entries
      - Conversation history (last 20 messages)
      - Current cart state
      - Current conversation stage
  → Call Gemini 2.5 Flash with system prompt + context
  → Parse AI response (text + structured actions)
  → Execute actions (update cart, decrement stock, create order)
  → Send response via FB/IG Send API
  → Store message in DB
  → Send notifications if needed (new order, handoff request)
```

### Gemini System Prompt Structure

```
You are {bot_persona_name}, a sales assistant for {business_name}.
Tone: {bot_tone}
Language: Always respond in Georgian (ქართული).

You understand:
- Georgian script (ქართული)
- Latin-transliterated Georgian (e.g., "gamarjoba" = გამარჯობა)
- Mixed messages

RULES:
- Never reveal you are an AI or bot
- Only discuss products in the catalog — never invent products or prices
- If unsure about anything, say "ნება მომეცით კოლეგას შევეკითხო" and trigger handoff
- Follow the conversation stages in order
- Always check stock before presenting a product
- Calculate delivery fees from the zone table — never guess

AVAILABLE PRODUCTS:
{json_product_list}

DELIVERY ZONES:
{json_delivery_zones}

PAYMENT INFO:
{payment_details}

CUSTOM FAQ:
{faq_entries}

CURRENT CONVERSATION STATE:
Stage: {current_stage}
Cart: {cart_contents}
Customer Info Collected: {customer_info}

Respond with JSON:
{
  "message": "Georgian text to send to customer",
  "actions": [
    { "type": "update_stage", "stage": "product_presentation" },
    { "type": "add_to_cart", "product_id": "...", "quantity": 1 },
    { "type": "request_handoff", "reason": "..." },
    { "type": "create_order" },
    { "type": "decrement_stock", "product_id": "...", "quantity": 1 }
  ]
}
```

### Transliteration Module

Build `lib/utils/georgian.ts` to handle Latin→Georgian mapping:

```
a→ა, b→ბ, g→გ, d→დ, e→ე, v→ვ, z→ზ, t→თ, i→ი, k→კ, l→ლ,
m→მ, n→ნ, o→ო, p→პ, zh→ჟ, r→რ, s→ს, t'→ტ, u→უ, f→ფ,
q→ქ, gh→ღ, sh→შ, ch→ჩ, ts→ც, dz→ძ, ts'→წ, ch'→ჭ, kh→ხ,
j→ჯ, h→ჰ
```

This is used for AI context enrichment, NOT for translating the UI.

---

## Dashboard Pages — Specification

Build each page according to the Stitch design. Below is the functional spec:

### 1. მიმოხილვა (Overview) — `/dashboard/overview`
- Stat cards: today's conversations, orders, revenue, avg response time
- 7-day trend chart (Recharts)
- Recent orders table (last 5)
- Conversations needing attention (handoff status)

### 2. საუბრები (Conversations) — `/dashboard/conversations`
- Split-screen layout: conversation list (left) + chat view (right)
- List items show: customer name, last message preview, platform badge (Messenger/Instagram), status badge, timestamp
- Chat view: full message history, scrollable, bot/customer/human messages styled differently
- "Take Over" button → sets status to `handoff`, shows text input
- "Release to Bot" button → sets status back to `active`
- Real-time updates via Supabase Realtime subscriptions

### 3. შეკვეთები (Orders) — `/dashboard/orders`
- Filterable, sortable table
- Columns: order number (SX-XXXXX), customer, items summary, total, payment status, delivery status, date
- Click to expand full order details
- Inline status updates (dropdowns for payment/delivery status)
- CSV export button

### 4. პროდუქტები (Products) — `/dashboard/products`
- Grid/list toggle view
- Each product card: image, name, price, stock indicator (green/yellow/red)
- Add/Edit product modal: name, price, description, stock, images (drag-drop upload to Supabase Storage), variants
- Delete with confirmation

### 5. ანალიტიკა (Analytics) — `/dashboard/analytics`
- Time period selector: 7d / 30d / 90d
- Charts (Recharts): conversations over time, revenue over time, conversion funnel
- Top products ranked list
- Peak hours heatmap (hour × day-of-week)
- Human handoff rate

### 6. პარამეტრები (Settings) — `/dashboard/settings`
Tabs:
- **პროფილი:** Business name, logo upload, contact info
- **ბოტი:** Persona name, tone selector, working hours, payment details
- **კავშირები:** Facebook page connect/disconnect (OAuth), Instagram connect
- **შეტყობინებები:** WhatsApp number, Telegram setup, notification preferences
- **FAQ:** CRUD for custom Q&A pairs
- **გამოწერა:** Current plan display, usage meter, upgrade flow

---

## Subscription & Plan Enforcement

| Feature | Starter (79₾) | Business (149₾) | Premium (299₾) |
|---|---|---|---|
| Facebook Pages | 1 | 1 | 3 |
| Instagram | ✗ | 1 | 2 |
| Monthly Conversations | 200 | 500 | Unlimited |
| Stock Management | ✗ | ✓ | ✓ |
| Google Sheets Sync | ✗ | ✓ | ✓ |
| Order Management | Basic | Full | Full |
| Analytics | Basic | Full | Advanced |
| Human Handoff | ✗ | ✓ | ✓ |
| Notifications | Email only | WhatsApp + Telegram | WhatsApp + Telegram |
| Priority Support | ✗ | ✗ | ✓ |

Enforce limits in middleware. When conversation limit approached (90%), show warning. When exceeded, allow current-day conversations to complete but prompt upgrade.

---

## Notification System

### WhatsApp Notifications
Use the WhatsApp Business API (or whatsapp-web.js as fallback for MVP) to send:
- New order alerts with order summary
- Handoff requests with conversation link
- Low-stock warnings
- Daily summary (optional, if configured)

### Telegram Notifications
Use Telegram Bot API to send identical notification types to a configured chat_id.

---

## Authentication Flow

1. Email/password signup via Supabase Auth
2. OR Facebook OAuth login (which also pre-authorizes page connection)
3. After signup → create tenant record → redirect to onboarding wizard
4. Onboarding wizard: Business Profile → Connect Facebook → Add Products → Set Delivery Zones → Add Payment Details → Test Bot
5. 14-day free trial starts at signup, no credit card required

---

## Key Development Rules

### Code Quality
- TypeScript strict mode, no `any` types
- All components must be typed with proper interfaces
- Server Components by default, Client Components only when needed (interactivity, hooks)
- Use Supabase server client in Server Components, browser client in Client Components
- All API routes must validate input (zod schemas)

### Performance
- Use Next.js ISR/SSG where possible for marketing pages
- Dashboard pages use server-side data fetching + Supabase Realtime for live updates
- Optimize images via next/image
- Lazy load analytics charts

### Security
- ALL database access through RLS — no exceptions
- Encrypt Facebook access tokens at rest (Supabase Vault or app-level encryption)
- Validate all webhook signatures (Facebook webhook verification)
- Rate limit API routes
- CSRF protection on all mutations
- Sanitize all user inputs before storing

### Georgian-Specific
- All user-facing text in Georgian
- Support RTL-like wide characters — test with long Georgian words
- Currency always formatted as `XXX ₾` (number + space + lari symbol)
- Phone numbers: Georgian format (+995 XXX XX XX XX)
- Date/time: Georgian locale formatting

### Error Handling
- All errors shown to users must be in Georgian
- Log errors with context (tenant_id, conversation_id) to Supabase
- Graceful degradation: if AI fails, queue message for human response and notify owner
- If Facebook API fails, retry with exponential backoff (3 attempts)

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Facebook
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_VERIFY_TOKEN=

# Instagram
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=

# AI
GEMINI_API_KEY=

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_KEY=

# Notifications
TELEGRAM_BOT_TOKEN=
WHATSAPP_API_TOKEN=

# App
NEXT_PUBLIC_APP_URL=https://sxarti.ge
ENCRYPTION_KEY=
```

---

## Build Order (Recommended Phases)

### Phase 0 — Design System Extraction (DO THIS FIRST)
0. Fetch Design System screen (`asset-stub-assets-898f50d916c44f86ae575adfc3ad788b-1774205211886`) → extract all tokens into `tailwind.config.ts` and `globals.css`
0. Fetch Component Library screen (`f92a82054d3b4265b6e526e6c705c4c8`) → build all shared `components/ui/*` and `components/shared/*`

### Phase 1 — Foundation
1. Next.js project setup with TypeScript, Tailwind, shadcn/ui
2. Supabase project setup, migrations, RLS policies
3. Auth flow — fetch Sign Up screen (`a09e2ce39a604cc2a7dedf0bfa0e2910`) and Log In screen (`495832f0dc524f319dfeaf899cc852f0`)
4. Tenant creation on signup
5. Dashboard shell layout (sidebar, navbar) — extract from Dashboard Overview screen (`981c621bee504e989f3d2a787815a562`)

### Phase 2 — Onboarding Wizard
6. Step 1: Business Profile — fetch screen `d80473b1d5f1418b80871cb77d01f142`
7. Step 2: Connect Facebook — fetch screen `172a992146824e3bb93ebc0c8c7c25b4`
8. Step 3: Add Products — fetch screen `95c4ee1738a940fa85bebce5a7d2fe2b`
9. Step 4: Delivery Zones — fetch screen `53eb067ea3ae48b28171525fbb70427a`
10. Step 5: Payment Details — fetch screen `44bad4078b0c4c02b9b714feadbd3a70`
11. Onboarding Complete — fetch screen `b06b8353bb1c4922a9fff340e7be8dde`

### Phase 3 — Dashboard Pages
12. Overview — fetch screen `981c621bee504e989f3d2a787815a562`
13. Products Catalog — fetch screen `4a43e51446724618afc946bc86ab45ff`
14. Orders Management — fetch screen `210facee2385472aa0c1bd38956007e6`
15. Conversations Inbox — fetch screen `dc45b98dd5d3443cb01b1cccb36bea8c`
16. Settings — fetch screen `dd07670d3cd744778eded9f8b1c0e1f7`

### Phase 4 — AI Bot & Messaging
17. Facebook OAuth page connection
18. Facebook webhook receiver
19. Gemini 2.5 Flash integration + system prompt
20. AI response pipeline (message → context → AI → response → send)
21. Conversation stage management
22. Cart, stock decrement, order creation logic
23. Georgian transliteration module

### Phase 5 — Notifications & Integrations
24. WhatsApp notification sender
25. Telegram notification sender
26. Google Sheets bidirectional sync
27. Human handoff flow

### Phase 6 — Subscription, Marketing & Polish
28. Plan enforcement middleware
29. Usage tracking (conversations/month)
30. Upgrade prompts
31. Landing page — fetch screen `7d8b52f4fa5c4136a1e07fbb25ffcb62`

---

## Critical Reminders

1. **Stitch designs are the source of truth for ALL UI.** Pull the design before writing any component.
2. **Georgian language everywhere** in the user-facing interface. Code, comments, and variable names stay in English.
3. **Multi-tenancy is non-negotiable.** Every query filters by tenant_id. Every RLS policy is tested.
4. **The existing TNLU codebase is reference only** — do not copy-paste. Build fresh on the new stack.
5. **Test with real Georgian text.** Not placeholder Latin strings.
