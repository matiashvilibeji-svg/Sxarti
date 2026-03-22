# Agent 3: Onboarding Wizard (Steps 1-5 + Complete)

## Mission

Build the 5-step onboarding wizard that new users complete after signup. Each step saves data to Supabase. All UI in Georgian.

## YOUR Files (create these)

- `src/app/(onboarding)/step-1/page.tsx` — Business Profile
- `src/app/(onboarding)/step-2/page.tsx` — Connect Facebook
- `src/app/(onboarding)/step-3/page.tsx` — Add Products
- `src/app/(onboarding)/step-4/page.tsx` — Delivery Zones
- `src/app/(onboarding)/step-5/page.tsx` — Payment Details
- `src/app/(onboarding)/complete/page.tsx` — Onboarding Complete

## Stitch MCP — Fetch Designs First

Use `mcp__stitch__get_screen` with project_id `12084308622143530029` for each:

| Step                     | Screen ID                          |
| ------------------------ | ---------------------------------- |
| Step 1: Business Profile | `d80473b1d5f1418b80871cb77d01f142` |
| Step 2: Connect Facebook | `172a992146824e3bb93ebc0c8c7c25b4` |
| Step 3: Add Products     | `95c4ee1738a940fa85bebce5a7d2fe2b` |
| Step 4: Delivery Zones   | `53eb067ea3ae48b28171525fbb70427a` |
| Step 5: Payment Details  | `44bad4078b0c4c02b9b714feadbd3a70` |
| Complete                 | `b06b8353bb1c4922a9fff340e7be8dde` |

## Functional Requirements

### Step 1: Business Profile (`/step-1`)

- Edit business name (pre-filled from signup)
- Logo upload (to Supabase Storage)
- Bot persona name (default: "ანა")
- Bot tone selector: formal / friendly / casual
- Working hours config (JSON)
- Save → update `tenants` table → navigate to `/step-2`

### Step 2: Connect Facebook (`/step-2`)

- Facebook OAuth button to connect a page
- Shows connected page name after success
- Saves `facebook_page_id` and `facebook_access_token` to tenant
- "Skip" option available
- Navigate to `/step-3`

### Step 3: Add Products (`/step-3`)

- Add product form: name, price (₾), description, stock quantity, images
- Image upload to Supabase Storage
- Product list showing added items
- Minimum 1 product to proceed
- Save to `products` table
- Navigate to `/step-4`

### Step 4: Delivery Zones (`/step-4`)

- Add delivery zone: zone name, fee (₾), estimated days
- Pre-populated suggestions: "თბილისი (ცენტრი)", "თბილისი (გარეუბანი)", "ბათუმი", "ქუთაისი"
- Editable list of zones
- Save to `delivery_zones` table
- Navigate to `/step-5`

### Step 5: Payment Details (`/step-5`)

- Bank transfer details: BOG IBAN, TBC account number
- Additional payment instructions text
- Save to `tenants.payment_details` (jsonb)
- Navigate to `/complete`

### Onboarding Complete (`/complete`)

- Success message with celebration animation/graphic
- Summary of what was set up
- "დაიწყე ბოტის გამოყენება" (Start using the bot) button → `/dashboard/overview`

## Shared UI

- Progress indicator showing current step (1-5)
- "უკან" (Back) and "შემდეგი" (Next) navigation
- All form validation with Georgian error messages
- Use components from `src/components/ui/` (button, input, card, select, etc.)

## Georgian UI Text Reference

- ბიზნეს პროფილი = Business Profile
- Facebook-ის დაკავშირება = Connect Facebook
- პროდუქტების დამატება = Add Products
- მიწოდების ზონები = Delivery Zones
- გადახდის დეტალები = Payment Details
- შემდეგი = Next
- უკან = Back
- გამოტოვება = Skip
- შენახვა = Save

## DO NOT Touch

- Any file outside `src/app/(onboarding)/step-*/` and `src/app/(onboarding)/complete/`
- `src/app/(onboarding)/layout.tsx` — Agent 1
- `src/components/ui/*` — Agent 1
- `src/lib/supabase/*` — Agent 1

## Completion

1. Run `npm run build` — must pass
2. Commit: "feat: add 5-step onboarding wizard with Georgian UI"
3. Output DONE
