# Agent 8: Notifications, Google Sheets, Edge Functions & Landing Page

## Mission

Build the notification system (WhatsApp + Telegram), Google Sheets sync, Supabase Edge Functions, and the marketing landing page. All user-facing text in Georgian.

## YOUR Files (create these)

### Notification Libraries

- `src/lib/notifications/whatsapp.ts` — WhatsApp Business API message sender
- `src/lib/notifications/telegram.ts` — Telegram Bot API message sender
- `src/lib/notifications/index.ts` — Unified notification dispatcher

### Google Sheets Integration

- `src/lib/sheets/sync.ts` — Bidirectional Google Sheets sync

### Supabase Edge Functions

- `supabase/functions/ai-respond/index.ts` — Process incoming message → AI response (Deno)
- `supabase/functions/webhook-facebook/index.ts` — Facebook webhook handler (Deno)
- `supabase/functions/sheets-sync/index.ts` — Google Sheets bidirectional sync (Deno)
- `supabase/functions/notifications/index.ts` — WhatsApp/Telegram push notifications (Deno)

### Marketing / Landing Page

- `src/app/(marketing)/page.tsx` — Landing page
- `src/app/(marketing)/layout.tsx` — Marketing layout (public navbar + footer)

## Stitch MCP — Fetch Landing Page Design

Use `mcp__stitch__get_screen` with project_id `12084308622143530029`:

- Landing Page: screen_id `7d8b52f4fa5c4136a1e07fbb25ffcb62`

## Functional Requirements

### WhatsApp Notifications (`whatsapp.ts`)

```typescript
export async function sendWhatsAppNotification(
  phoneNumber: string,
  message: string,
  type: "new_order" | "handoff" | "low_stock" | "daily_summary",
): Promise<void>;
```

- Use WhatsApp Business API (Cloud API)
- POST to `https://graph.facebook.com/v19.0/{phone_number_id}/messages`
- Format messages with Georgian text
- Notification types:
  - **New Order**: "ახალი შეკვეთა SX-XXXXX! მომხმარებელი: {name}, ჯამი: {total} ₾"
  - **Handoff**: "მომხმარებელს დახმარება სჭირდება: {reason}"
  - **Low Stock**: "პროდუქტი '{name}' იწურება — დარჩა {quantity}"
  - **Daily Summary**: "დღის ანგარიში: {orders} შეკვეთა, {revenue} ₾ შემოსავალი"

### Telegram Notifications (`telegram.ts`)

```typescript
export async function sendTelegramNotification(
  chatId: string,
  message: string,
  type: "new_order" | "handoff" | "low_stock" | "daily_summary",
): Promise<void>;
```

- Use Telegram Bot API
- POST to `https://api.telegram.org/bot{token}/sendMessage`
- Same notification types and Georgian messages as WhatsApp
- Support HTML formatting in messages

### Unified Notification Dispatcher (`index.ts`)

```typescript
export async function notifyOwner(
  tenantId: string,
  type: NotificationType,
  data: NotificationData,
): Promise<void>;
// Reads tenant.notification_config to determine which channels are enabled
// Sends to all enabled channels (WhatsApp, Telegram)
```

### Google Sheets Sync (`sheets/sync.ts`)

```typescript
export async function syncToSheet(
  tenantId: string,
  sheetId: string,
): Promise<void>;
export async function syncFromSheet(
  tenantId: string,
  sheetId: string,
): Promise<void>;
```

- Bidirectional sync between `products` table and Google Sheet
- Sheet columns: Name, Price, Stock, Description, Active
- Uses Google Sheets API v4 with service account
- Handle conflicts: DB wins on sync-to-sheet, sheet wins on sync-from-sheet
- Only for Business and Premium plan tenants

### Supabase Edge Functions (Deno)

Each edge function follows this pattern:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  // ... function logic
});
```

**ai-respond**: Receives message, loads context, calls Gemini, returns response
**webhook-facebook**: Alternative webhook handler running on edge
**sheets-sync**: Scheduled sync trigger
**notifications**: Send notifications via WhatsApp/Telegram

### Landing Page (`/` via `(marketing)/page.tsx`)

- Follow Stitch design exactly
- Sections:
  - Hero: tagline "შენი გაყიდვები არასდროს იძინებს", CTA button "უფასოდ დაიწყე"
  - Features grid: AI bot, multi-platform, analytics, notifications
  - Pricing table: 3 plans (Starter 79₾, Business 149₾, Premium 299₾)
  - Testimonials (placeholder)
  - Footer with links
- CTA buttons → `/signup`
- Georgian-first, responsive, mobile-friendly
- Use ISR/SSG for performance

### Marketing Layout (`(marketing)/layout.tsx`)

- Public navbar: Sxarti logo, nav links (მთავარი, ფასები, შესვლა)
- Footer: © 2024 Sxarti, social links

## Georgian Text Reference

- შენი გაყიდვები არასდროს იძინებს = Your sales never sleep
- უფასოდ დაიწყე = Start for free
- მთავარი = Home
- ფასები = Pricing
- შესვლა = Login
- ფუნქციები = Features

## DO NOT Touch

- Any file outside `src/lib/notifications/`, `src/lib/sheets/`, `supabase/functions/`, `src/app/(marketing)/`
- `src/lib/supabase/*` — Agent 1
- `src/lib/ai/*` — Agent 7
- `src/lib/facebook/*` — Agent 7
- `src/components/ui/*` — Agent 1

## Completion

1. Run `npm run build` — must pass
2. Commit: "feat: add notifications, Google Sheets sync, edge functions, and landing page"
3. Output DONE
