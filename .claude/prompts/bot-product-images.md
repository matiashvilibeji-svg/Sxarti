# Enable Bot to Send Product Images via Messenger/Instagram

## Context

- Products already have `images` text array field with public Supabase Storage URLs
- Image upload component exists at `src/components/products/image-upload.tsx`
- Storage bucket `product-images` exists and is public
- Bot currently sends TEXT ONLY via `src/lib/facebook/messenger.ts` and `src/lib/instagram/messaging.ts`
- System prompt in `src/lib/ai/prompts/system.ts` includes products as text only with no image URLs
- Gemini response schema in `src/lib/ai/gemini.ts` has no image-sending action

## Phase 1: Include Product Image URLs in Bot Context

**File:** `src/lib/ai/prompts/system.ts`

- When formatting products for the system prompt, include image URLs
- Format example: `- **Name** (ID: uuid) — Price | stock: N | images: [url1, url2] | description`
- This lets Gemini know which products have images and their URLs

## Phase 2: Add send_product_images Action to Gemini Schema

**File:** `src/lib/ai/gemini.ts`

- Add new action type: `send_product_images`
- Schema: `{ type: "send_product_images", product_id: string }`
- Update the Gemini response schema to include this action

**File:** `src/lib/ai/prompts/system.ts`

- Add instruction in system prompt: "When a customer asks to see a product, asks for photos, or when showing a product recommendation, use the send_product_images action with the product_id. Send images BEFORE or alongside the text response."

## Phase 3: Implement Image Sending in Platform APIs

**File:** `src/lib/facebook/messenger.ts`

- Add `sendImage(recipientId: string, imageUrl: string, pageAccessToken: string)` function
- Use Facebook Graph API image attachment:
  `{ attachment: { type: "image", payload: { url: imageUrl, is_reusable: true } } }`
- Handle errors gracefully (image URL might be broken)

**File:** `src/lib/instagram/messaging.ts`

- Add equivalent `sendImage()` for Instagram
- Instagram uses: `{ attachment: { type: "image", payload: { url: imageUrl } } }`

## Phase 4: Execute Image Action in Pipeline

**File:** `src/lib/ai/pipeline.ts`

- In `executeAction()` or equivalent, handle `send_product_images`:
  1. Look up product by `product_id` from the already-loaded products array
  2. Get `product.images` array
  3. For each image URL, call `sendImage()` on the appropriate platform
  4. Send images BEFORE the text response so customer sees them in order
- If product has no images, skip silently (bot can still describe it in text)
- Cap at 4 images max per interaction to avoid spam

## Phase 5: Verify Multi-Image Upload Works End-to-End

**File:** `src/components/products/image-upload.tsx`

- Verify businesses can upload multiple images (component already supports this)
- Check there is no artificial limit that is too low — allow up to 5-10 images per product
- Ensure image deletion (removing from array) works correctly
- Verify images persist correctly in the products.images text array column

## Edge Cases to Handle

- Product has no images: bot responds with text only, no error
- Image URL is broken/expired: catch error, continue sending remaining images
- Rate limiting on Facebook/Instagram API: respect existing retry/backoff logic
- Large number of images: cap at 4 images sent per interaction to avoid spam
- Bot should not send duplicate images in same conversation turn

## Success Criteria

1. When customer asks "show me Product X" or "do you have photos?", bot sends the actual product images from Supabase Storage
2. Images display correctly in both Facebook Messenger and Instagram DMs
3. Business owners can upload 1-10 images per product from the dashboard
4. Bot intelligently decides WHEN to send images (not every message)
5. No regression in existing text messaging or order flow
6. `npm run build` passes with no errors
