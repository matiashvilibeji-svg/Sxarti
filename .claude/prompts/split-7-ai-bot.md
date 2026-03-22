# Agent 7: AI Bot, Webhooks & Facebook/Instagram Integration

## Mission

Build the AI sales bot pipeline: Gemini 2.5 Flash integration, Facebook/Instagram webhook handlers, message processing pipeline, Georgian transliteration module, and all API routes.

## YOUR Files (create these)

### AI Pipeline

- `src/lib/ai/gemini.ts` — Gemini 2.5 Flash client wrapper
- `src/lib/ai/pipeline.ts` — Full message → context → AI → response → send pipeline
- `src/lib/ai/prompts/system.ts` — System prompt builder (dynamically builds prompt with tenant data)
- `src/lib/ai/prompts/stages.ts` — Conversation stage definitions and transitions

### Facebook Integration

- `src/lib/facebook/webhook.ts` — Webhook verification & incoming message parsing
- `src/lib/facebook/messenger.ts` — Send Message API wrapper
- `src/lib/facebook/oauth.ts` — Facebook Page OAuth flow (connect/disconnect)

### Instagram Integration

- `src/lib/instagram/webhook.ts` — Instagram webhook handler
- `src/lib/instagram/messaging.ts` — Instagram DM Send API wrapper

### API Routes

- `src/app/api/webhooks/facebook/route.ts` — GET (verification) + POST (incoming messages)
- `src/app/api/webhooks/instagram/route.ts` — GET (verification) + POST (incoming messages)

### Utilities

- `src/lib/utils/georgian.ts` — Georgian ↔ Latin transliteration module

## Functional Requirements

### Gemini 2.5 Flash Client (`gemini.ts`)

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize with GEMINI_API_KEY env var
// Create chat completion function that:
// 1. Takes system prompt + conversation history
// 2. Returns structured JSON response
// 3. Handles errors gracefully (timeout, rate limit, malformed response)
```

### System Prompt Builder (`prompts/system.ts`)

Build the full system prompt dynamically per-conversation:

```
You are {bot_persona_name}, a sales assistant for {business_name}.
Tone: {bot_tone}
Language: Always respond in Georgian (ქართული).
...
```

Include:

- Tenant's active products (name, price, stock, description)
- Delivery zones and fees
- Payment details
- FAQ entries
- Current conversation stage
- Current cart contents
- Customer info collected so far

Output format:

```json
{
  "message": "Georgian text to send",
  "actions": [
    { "type": "update_stage", "stage": "..." },
    { "type": "add_to_cart", "product_id": "...", "quantity": 1 },
    { "type": "request_handoff", "reason": "..." },
    { "type": "create_order" },
    { "type": "decrement_stock", "product_id": "...", "quantity": 1 }
  ]
}
```

### Conversation Stages (`prompts/stages.ts`)

Define stages and valid transitions:

1. `greeting` → `needs_assessment`
2. `needs_assessment` → `product_presentation`
3. `product_presentation` → `upsell` | `cart_review`
4. `upsell` → `cart_review`
5. `cart_review` → `info_collection`
6. `info_collection` → `delivery_calculation`
7. `delivery_calculation` → `order_confirmation`
8. `order_confirmation` → `complete`

### Message Pipeline (`pipeline.ts`)

```
1. Receive message (from webhook)
2. Identify tenant by facebook_page_id or instagram_account_id
3. Find or create conversation record
4. Load context: products, zones, FAQs, history (last 20 messages)
5. Build system prompt
6. Call Gemini 2.5 Flash
7. Parse structured JSON response
8. Execute actions:
   - update_stage → update conversation.current_stage
   - add_to_cart → update conversation.cart (jsonb append)
   - decrement_stock → update products.stock_quantity
   - create_order → insert into orders table with SX-XXXXX number
   - request_handoff → set status='handoff', notify owner
9. Store bot message in messages table
10. Send response via Facebook/Instagram Send API
11. Update conversation.last_message_at
```

### Facebook Webhook (`api/webhooks/facebook/route.ts`)

- **GET**: Verify webhook with `FACEBOOK_VERIFY_TOKEN`
- **POST**: Parse incoming messages from Facebook Messenger
  - Extract sender ID, message text, page ID
  - Call pipeline.processMessage()
  - Return 200 quickly (process async if needed)
  - Validate webhook signature with `FACEBOOK_APP_SECRET`

### Instagram Webhook (`api/webhooks/instagram/route.ts`)

- Same pattern as Facebook but for Instagram DM API
- Different message format parsing

### Facebook Messenger Send API (`messenger.ts`)

```typescript
export async function sendMessage(
  pageAccessToken: string,
  recipientId: string,
  text: string,
): Promise<void>;
// POST to https://graph.facebook.com/v19.0/me/messages
// Retry with exponential backoff (3 attempts)
```

### Facebook OAuth (`oauth.ts`)

```typescript
export function getOAuthUrl(redirectUri: string): string;
export async function exchangeCode(
  code: string,
): Promise<{ pageId: string; accessToken: string; pageName: string }>;
// Handle the full OAuth flow for connecting a Facebook Page
```

### Georgian Transliteration (`georgian.ts`)

```typescript
export function latinToGeorgian(text: string): string;
export function georgianToLatin(text: string): string;
// Mapping:
// a→ა, b→ბ, g→გ, d→დ, e→ე, v→ვ, z→ზ, t→თ, i→ი, k→კ, l→ლ,
// m→მ, n→ნ, o→ო, p→პ, zh→ჟ, r→რ, s→ს, t'→ტ, u→უ, f→ფ,
// q→ქ, gh→ღ, sh→შ, ch→ჩ, ts→ც, dz→ძ, ts'→წ, ch'→ჭ, kh→ხ,
// j→ჯ, h→ჰ
// Handle multi-character mappings (sh, ch, etc.) BEFORE single-character
```

### Order Number Generation

```typescript
function generateOrderNumber(): string {
  // Format: SX-XXXXX (5 random digits)
  return `SX-${String(Math.floor(10000 + Math.random() * 90000))}`;
}
```

## Security Requirements

- Validate Facebook webhook signature on every POST
- Never log access tokens
- Use `FACEBOOK_VERIFY_TOKEN` env var for GET verification
- Rate limit webhook endpoints
- Sanitize all incoming message text before storing

## Error Handling

- If Gemini fails → queue message for human, set conversation to handoff, notify owner
- If Facebook Send API fails → retry 3x with exponential backoff
- Log all errors with tenant_id and conversation_id context

## DO NOT Touch

- Any file outside `src/lib/ai/`, `src/lib/facebook/`, `src/lib/instagram/`, `src/app/api/`, `src/lib/utils/georgian.ts`
- `src/lib/supabase/*` — Agent 1
- `src/lib/utils/currency.ts` — Agent 1
- `src/lib/utils/delivery.ts` — Agent 1

## Completion

1. Run `npm run build` — must pass
2. Commit: "feat: add AI sales bot pipeline, Facebook/Instagram webhooks, Georgian transliteration"
3. Output DONE
