# Facebook Chatbot Manual Key Entry Connection

**Date:** 2026-03-25
**Status:** Approved
**Approach:** B — Client-side validation + server-side webhook subscription

## Problem

The Facebook chatbot connection currently uses a non-functional OAuth button in Settings > Connections. We need a working manual key entry flow (like the ads connection) where users enter their Page ID and Page Access Token directly.

## Architecture

### Data Flow — Connect

1. User enters Facebook Page ID + Page Access Token in the ConnectionsTab form
2. Client sends `POST /api/facebook/connect` with `{ pageId, accessToken }`
3. Server authenticates user via `supabase.auth.getUser()`, derives tenant from `owner_id`
4. Server validates token: `GET /v19.0/me?access_token={token}`
5. Server validates page access: `GET /v19.0/{pageId}?fields=name&access_token={token}`
6. Server checks no other tenant already uses this `facebook_page_id` (uniqueness)
7. Server calls `subscribePage(pageId, accessToken)` to register webhook
8. Server upserts `facebook_page_id` + `facebook_access_token` on the `tenants` table
9. Returns `{ success: true, pageName }`, client refreshes tenant state

### Data Flow — Disconnect

1. User clicks "გათიშვა" (Disconnect) button
2. Confirmation dialog appears
3. Client calls `POST /api/facebook/disconnect`
4. Server authenticates user, derives tenant
5. Server clears `facebook_page_id = null` and `facebook_access_token = null` on tenants table
6. Tenant state refreshes, form reappears for reconnection

### Reconnection

User must disconnect first, then connect with new credentials. The connected state shows only the disconnect button, not a "change" option.

## Files

| File                                       | Action | Description                                                                       |
| ------------------------------------------ | ------ | --------------------------------------------------------------------------------- |
| `src/app/dashboard/settings/page.tsx`      | Modify | Replace `ConnectionsTab` with manual entry form + connected status + disconnect   |
| `src/app/api/facebook/connect/route.ts`    | Create | POST handler: authenticate, validate, subscribe webhook, upsert DB                |
| `src/app/api/facebook/disconnect/route.ts` | Create | POST handler: authenticate, clear facebook fields on tenant                       |
| `src/lib/facebook/oauth.ts`                | Keep   | Reuse `subscribePage()` function; other OAuth functions remain but unused from UI |

## UI Design — ConnectionsTab

### Not Connected State

Facebook Messenger card containing:

- Page ID text input with helper: "იპოვე Facebook Business Settings-ში → Page ID"
- Page Access Token password input with helper: "შექმენი Graph API Explorer-ში → აირჩიე pages_messaging permission. გამოიყენე Long-Lived Page Access Token."
- "დაკავშირება" button (Facebook blue `#1877F2`, full-width, with FB icon)
- Loading state during connection
- Georgian error toasts for invalid token, invalid page, duplicate page, or server errors
- Styling follows `src/components/dashboard/ads/connect-screen.tsx` visual pattern (card layout, inputs, button), but all validation happens server-side via the API route

### Connected State

Facebook Messenger card showing:

- "დაკავშირებულია" status with page name (if available) and Page ID
- "გათიშვა" button with destructive styling
- Confirmation dialog before disconnect

### Instagram Section

Unchanged — keeps existing placeholder.

## API Route — POST /api/facebook/connect

**Request body:**

```json
{
  "pageId": "string",
  "accessToken": "string"
}
```

Note: `tenantId` is NOT in the request body. The server derives the tenant from the authenticated user's `owner_id`.

**Logic:**

1. Authenticate: `supabase.auth.getUser()` — reject 401 if unauthenticated
2. Derive tenant: query `tenants` where `owner_id = user.id`
3. Validate token: `GET /v19.0/me?access_token={token}` — reject 400 if fails
4. Validate page: `GET /v19.0/{pageId}?fields=name&access_token={token}` — reject 400 if fails
5. Check uniqueness: ensure no other tenant has this `facebook_page_id` — reject 409 if duplicate
6. Subscribe webhook: `subscribePage(pageId, accessToken)` from `oauth.ts`
7. Update tenants table: set `facebook_page_id` + `facebook_access_token` where `id = tenant.id`
8. Return `{ success: true, pageName: string }`

**Error responses:**

- 401: Unauthenticated
- 400: Invalid token or page ID
- 409: Page already connected to another tenant
- 500: Webhook subscription failed or DB error

## API Route — POST /api/facebook/disconnect

**No request body needed.**

**Logic:**

1. Authenticate: `supabase.auth.getUser()` — reject 401 if unauthenticated
2. Derive tenant: query `tenants` where `owner_id = user.id`
3. Update tenants table: set `facebook_page_id = null`, `facebook_access_token = null`
4. Return `{ success: true }`

## Database

No schema changes needed. The `tenants` table already has:

- `facebook_page_id text` — stores the Page ID
- `facebook_access_token text` — stores the Page Access Token

The webhook function (`webhook-facebook/index.ts`) already reads both columns to identify tenants and send replies.

## Token Expiry Note

Facebook Page Access Tokens from Graph API Explorer are short-lived (~1 hour). Users should generate a long-lived Page Access Token (which is effectively permanent for page tokens). The helper text in the UI will guide users to use long-lived tokens. Future enhancement: the server could attempt to exchange short-lived tokens for long-lived ones using `FACEBOOK_APP_SECRET`.

## What Stays Untouched

- `supabase/functions/webhook-facebook/index.ts` — message processing pipeline
- `src/lib/facebook/oauth.ts` `subscribePage()` — reused by new API route
- All conversation, order, and AI processing logic

## Success Criteria

- User can enter Page ID + Access Token and connect successfully
- Server-side validation catches invalid tokens, unauthorized pages, and duplicate pages
- Georgian error messages for all failure cases
- Page webhook subscription happens automatically on connect
- Existing message flow works unchanged after manual connection
- User can disconnect and reconnect with a different account
- API routes are authenticated — no tenant ID in request body
- UI is responsive and matches ads connect-screen visual quality
