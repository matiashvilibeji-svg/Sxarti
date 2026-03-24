## Task: Diagnose and Fix Website Performance Issues

### Context

Next.js 14 + Supabase app deployed on Vercel. User reports slow loading and sluggish interactions.

### Phase 1: Diagnose (read-only, no changes)

**1.1 Bundle Analysis**

- Run `npx @next/bundle-analyzer` or check build output sizes
- Identify pages with largest First Load JS (from build: admin/billing 300KB, analytics 274KB, overview 205KB)
- Check if heavy dependencies (zod, recharts, date-fns) are being bundled into shared chunks unnecessarily

**1.2 Middleware Audit**

- File: `src/middleware.ts` — currently 74.5KB which is very heavy
- Check if it runs on every route including static assets
- Check if it makes Supabase auth calls on every request (getUser/getSession)
- Add proper `matcher` config to skip static files, \_next, images, api routes

**1.3 Client vs Server Components**

- Check which dashboard pages use "use client" that could be server components
- Check if `useTenant()` hook triggers redundant auth calls (getUser then query tenants) on every page navigation
- Check if there's any session caching or if every route re-authenticates

**1.4 Supabase Query Performance**

- Check for missing database indexes (tenant_id on all tables)
- Check if delivery_zones, products, messages queries use proper filters
- Check if the ai-respond edge function has timeouts or slow Gemini calls blocking UX

**1.5 Image Optimization**

- Check if product/logo images use next/image with proper sizing
- Check if Supabase storage URLs are optimized (transform params)

### Phase 2: Fix (prioritized by impact)

**Priority 1: Middleware optimization**

- Add matcher to skip static routes
- Cache auth session to avoid re-checking on every request
- Target: reduce middleware from 74.5KB

**Priority 2: Reduce redundant Supabase calls**

- useTenant hook: consider caching tenant data in context/cookie after first fetch
- Avoid calling supabase.auth.getUser() on every client component mount

**Priority 3: Dynamic imports for heavy pages**

- Lazy load recharts on analytics page
- Lazy load heavy admin components
- Use next/dynamic with ssr: false for client-only heavy components

**Priority 4: Add database indexes**

- Add indexes on frequently queried columns (tenant_id, conversation_id, is_active)
- Apply via Supabase migration

### Phase 3: Verify

- `npm run build` — check bundle sizes decreased
- Compare First Load JS before/after
- Test page load speed in browser dev tools
- No functionality regression

### Abort Conditions

- If performance issue is Vercel cold starts (serverless), note it but don't try to fix
- If issue is Supabase free tier latency, note it as infrastructure limitation
