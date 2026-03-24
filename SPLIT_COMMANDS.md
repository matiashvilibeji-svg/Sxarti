# Split Execution Plan

Generated from: `/Users/bezhomatiashvili/Desktop/Sxarti/FIrst Prompt.md`
Date: 2026-03-22
Total agents: 8 (1 sequential + 7 parallel)
Estimated parallel time: ~45-60 min (Agent 1: ~25 min, then Agents 2-8 in parallel: ~20-35 min)

---

## Conflict Matrix

| Agent                       | Branch                                    | Files Touched                                                                                                                                                                                                                                                                                                                                  | Safe With                                         |
| --------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1 — Foundation              | `feature/split-1-foundation`              | package.json, configs, src/app/layout.tsx, src/app/page.tsx, src/app/(_)/layout.tsx, src/lib/supabase/_, src/types/_, src/components/ui/_, src/components/shared/_, src/lib/utils/currency+delivery, src/lib/utils.ts, src/hooks/_, src/middleware.ts, src/styles/globals.css, supabase/migrations/\*, supabase/config.toml, supabase/seed.sql | **NONE — must run first and merge before others** |
| 2 — Auth Pages              | `feature/split-2-auth`                    | src/app/(auth)/login/page.tsx, src/app/(auth)/signup/page.tsx                                                                                                                                                                                                                                                                                  | 3, 4, 5, 6, 7, 8                                  |
| 3 — Onboarding              | `feature/split-3-onboarding`              | src/app/(onboarding)/step-1..5/page.tsx, src/app/(onboarding)/complete/page.tsx                                                                                                                                                                                                                                                                | 2, 4, 5, 6, 7, 8                                  |
| 4 — Overview+Analytics      | `feature/split-4-dashboard-charts`        | src/app/(dashboard)/overview/page.tsx, src/app/(dashboard)/analytics/page.tsx, src/components/dashboard/\*                                                                                                                                                                                                                                     | 2, 3, 5, 6, 7, 8                                  |
| 5 — Products+Orders         | `feature/split-5-products-orders`         | src/app/(dashboard)/products/page.tsx, src/app/(dashboard)/orders/page.tsx, src/components/products/\*                                                                                                                                                                                                                                         | 2, 3, 4, 6, 7, 8                                  |
| 6 — Conversations+Settings  | `feature/split-6-conversations-settings`  | src/app/(dashboard)/conversations/page.tsx, src/app/(dashboard)/settings/page.tsx, src/components/chat/\*                                                                                                                                                                                                                                      | 2, 3, 4, 5, 7, 8                                  |
| 7 — AI Bot+Webhooks         | `feature/split-7-ai-bot`                  | src/lib/ai/_, src/lib/facebook/_, src/lib/instagram/_, src/app/api/webhooks/_, src/lib/utils/georgian.ts                                                                                                                                                                                                                                       | 2, 3, 4, 5, 6, 8                                  |
| 8 — Notifications+Marketing | `feature/split-8-notifications-marketing` | src/lib/notifications/_, src/lib/sheets/_, supabase/functions/\*, src/app/(marketing)/page.tsx, src/app/(marketing)/layout.tsx                                                                                                                                                                                                                 | 2, 3, 4, 5, 6, 7                                  |

**Zero file conflicts between Agents 2-8.** All 7 can run in parallel after Agent 1 merges.

---

## Step 1: Run Agent 1 (Foundation) — SEQUENTIAL

This must complete and merge before anything else.

### Terminal Tab 1 — Agent 1: Foundation

```bash
cd /Users/bezhomatiashvili/Desktop/Sxarti
git checkout -b feature/split-1-foundation
claude
```

Paste inside Claude Code:

```
Read .claude/prompts/split-1-foundation.md and execute all instructions.
```

**Wait for Agent 1 to output DONE.**

### Merge Agent 1 to main

```bash
cd /Users/bezhomatiashvili/Desktop/Sxarti
git checkout main
git merge feature/split-1-foundation
npm run build  # verify merge is clean
```

---

## Step 2: Create branches for parallel agents

```bash
cd /Users/bezhomatiashvili/Desktop/Sxarti
git checkout main

# Create all 7 branches from the updated main (which now has the foundation)
git branch feature/split-2-auth
git branch feature/split-3-onboarding
git branch feature/split-4-dashboard-charts
git branch feature/split-5-products-orders
git branch feature/split-6-conversations-settings
git branch feature/split-7-ai-bot
git branch feature/split-8-notifications-marketing
```

---

## Step 3: Run Agents 2-8 in PARALLEL (7 terminal tabs)

### Terminal Tab 2 — Agent 2: Auth Pages

```bash
cd /Users/bezhomatiashvili/Desktop/Sxarti
git checkout feature/split-2-auth
claude
```

Paste:

```
Read .claude/prompts/split-2-auth-pages.md and execute all instructions.
```

### Terminal Tab 3 — Agent 3: Onboarding Wizard

```bash
cd /Users/bezhomatiashvili/Desktop/Sxarti
git checkout feature/split-3-onboarding
claude
```

Paste:

```
Read .claude/prompts/split-3-onboarding.md and execute all instructions.
```

### Terminal Tab 4 — Agent 4: Dashboard Overview + Analytics

```bash
cd /Users/bezhomatiashvili/Desktop/Sxarti
git checkout feature/split-4-dashboard-charts
claude
```

Paste:

```
Read .claude/prompts/split-4-dashboard-overview.md and execute all instructions.
```

### Terminal Tab 5 — Agent 5: Products + Orders

```bash
cd /Users/bezhomatiashvili/Desktop/Sxarti
git checkout feature/split-5-products-orders
claude
```

Paste:

```
Read .claude/prompts/split-5-products-orders.md and execute all instructions.
```

### Terminal Tab 6 — Agent 6: Conversations + Settings

```bash
cd /Users/bezhomatiashvili/Desktop/Sxarti
git checkout feature/split-6-conversations-settings
claude
```

Paste:

```
Read .claude/prompts/split-6-conversations-settings.md and execute all instructions.
```

### Terminal Tab 7 — Agent 7: AI Bot + Webhooks

```bash
cd /Users/bezhomatiashvili/Desktop/Sxarti
git checkout feature/split-7-ai-bot
claude
```

Paste:

```
Read .claude/prompts/split-7-ai-bot.md and execute all instructions.
```

### Terminal Tab 8 — Agent 8: Notifications + Marketing

```bash
cd /Users/bezhomatiashvili/Desktop/Sxarti
git checkout feature/split-8-notifications-marketing
claude
```

Paste:

```
Read .claude/prompts/split-8-notifications-marketing.md and execute all instructions.
```

---

## Step 4: Merge after ALL agents finish

**Wait for ALL 7 agents to output DONE before merging.**

Merge order: smallest changes first, largest last.

```bash
cd /Users/bezhomatiashvili/Desktop/Sxarti
git checkout main

# 1. Auth pages (2 files) — smallest
git merge feature/split-2-auth
echo "Merged auth"

# 2. Onboarding (6 files)
git merge feature/split-3-onboarding
echo "Merged onboarding"

# 3. Dashboard Overview + Analytics (~12 files)
git merge feature/split-4-dashboard-charts
echo "Merged dashboard charts"

# 4. Products + Orders (~8 files)
git merge feature/split-5-products-orders
echo "Merged products & orders"

# 5. Conversations + Settings (~12 files)
git merge feature/split-6-conversations-settings
echo "Merged conversations & settings"

# 6. AI Bot + Webhooks (~12 files)
git merge feature/split-7-ai-bot
echo "Merged AI bot"

# 7. Notifications + Marketing (~10 files) — largest
git merge feature/split-8-notifications-marketing
echo "Merged notifications & marketing"

# Final build verification
npm run build
echo "All agents merged successfully!"
```

---

## Step 5: Cleanup

```bash
cd /Users/bezhomatiashvili/Desktop/Sxarti
git branch -d feature/split-1-foundation
git branch -d feature/split-2-auth
git branch -d feature/split-3-onboarding
git branch -d feature/split-4-dashboard-charts
git branch -d feature/split-5-products-orders
git branch -d feature/split-6-conversations-settings
git branch -d feature/split-7-ai-bot
git branch -d feature/split-8-notifications-marketing
```

---

## Deferred Items

These tasks are NOT included in the split and should be done after all agents merge:

| Item                                             | Reason                                                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| **Subscription plan enforcement middleware**     | Touches `src/middleware.ts` (created by Agent 1) — would conflict. Add after merge as a follow-up.     |
| **Usage tracking (conversations/month counter)** | Depends on webhook pipeline (Agent 7) + middleware (Agent 1) integration.                              |
| **Upgrade prompts / payment flow**               | No payment gateway — bank transfer only. Placeholder in Settings (Agent 6).                            |
| **Supabase Edge Functions deployment**           | Agent 8 creates the code, but actual deployment requires `supabase functions deploy` with credentials. |
| **Facebook/Instagram webhook registration**      | Requires live Facebook App credentials and URL verification.                                           |
| **WhatsApp Business API setup**                  | Requires Meta Business verification and approved templates.                                            |
| **Google Sheets service account**                | Requires creating GCP project and service account credentials.                                         |
| **Vercel deployment**                            | Run after all code is merged and build passes.                                                         |
| **Production environment variables**             | Set up `.env.local` with real credentials after deployment config.                                     |

---

---

# Split Execution Plan — Admin Panel

Generated from: Stitch Project 921506058610128825 (10 desktop + 8 mobile screens)
Date: 2026-03-23
Total agents: 9 (1 sequential + 8 parallel)
Estimated parallel time: ~25-35 min (Agent 0: ~10 min, then Agents 1-8 in parallel: ~15-25 min)

## Architecture Overview

Building a **platform admin panel** at `/admin/*` for Sxarti operators. Separate from the existing tenant dashboard at `/dashboard/*`.

| Route                  | Page                    | Agent   |
| ---------------------- | ----------------------- | ------- |
| `/admin/overview`      | Dashboard Overview      | Agent 1 |
| `/admin/businesses`    | Business Directory      | Agent 2 |
| `/admin/billing`       | Subscriptions & Billing | Agent 3 |
| `/admin/bot-monitor`   | Bot Monitor             | Agent 4 |
| `/admin/cms`           | Website CMS             | Agent 5 |
| `/admin/feature-flags` | Feature Flags           | Agent 6 |
| `/admin/support`       | Support Tickets         | Agent 7 |
| `/admin/system-health` | System Health           | Agent 8 |
| `/admin/settings`      | Settings                | Agent 8 |

## Conflict Matrix

| Agent                   | Branch                           | Files Touched                                                                                                                                                                                                                                                                                   | Safe to Run With          |
| ----------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| **0 (Foundation)**      | `admin/split-10-foundation`      | `supabase/migrations/20260323000011_*`, `src/types/admin.ts`, `src/middleware.ts`, `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`, `src/components/admin/admin-sidebar.tsx`, `src/components/admin/admin-navbar.tsx`, `src/components/admin/admin-stat-card.tsx`, `src/lib/admin/auth.ts` | **NONE — must run first** |
| **1 (Overview)**        | `admin/split-11-overview`        | `src/app/admin/overview/*`, `src/components/admin/overview/*`                                                                                                                                                                                                                                   | 2, 3, 4, 5, 6, 7, 8       |
| **2 (Businesses)**      | `admin/split-12-businesses`      | `src/app/admin/businesses/*`, `src/components/admin/businesses/*`                                                                                                                                                                                                                               | 1, 3, 4, 5, 6, 7, 8       |
| **3 (Billing)**         | `admin/split-13-billing`         | `src/app/admin/billing/*`, `src/components/admin/billing/*`                                                                                                                                                                                                                                     | 1, 2, 4, 5, 6, 7, 8       |
| **4 (Bot Monitor)**     | `admin/split-14-bot-monitor`     | `src/app/admin/bot-monitor/*`, `src/components/admin/bot-monitor/*`                                                                                                                                                                                                                             | 1, 2, 3, 5, 6, 7, 8       |
| **5 (CMS)**             | `admin/split-15-cms`             | `src/app/admin/cms/*`, `src/components/admin/cms/*`                                                                                                                                                                                                                                             | 1, 2, 3, 4, 6, 7, 8       |
| **6 (Feature Flags)**   | `admin/split-16-feature-flags`   | `src/app/admin/feature-flags/*`, `src/components/admin/feature-flags/*`                                                                                                                                                                                                                         | 1, 2, 3, 4, 5, 7, 8       |
| **7 (Support)**         | `admin/split-17-support`         | `src/app/admin/support/*`, `src/components/admin/support/*`                                                                                                                                                                                                                                     | 1, 2, 3, 4, 5, 6, 8       |
| **8 (Health+Settings)** | `admin/split-18-health-settings` | `src/app/admin/system-health/*`, `src/app/admin/settings/*`, `src/components/admin/system-health/*`, `src/components/admin/settings/*`                                                                                                                                                          | 1, 2, 3, 4, 5, 6, 7       |

**Zero file conflicts between Agents 1-8.**

## Step 1: Create Branches

```bash
cd /Users/bezhomatiashvili/Desktop/Sxarti

# Foundation branch (from main)
git checkout main
git checkout -b admin/split-10-foundation
```

## Step 2a: Run Foundation Agent FIRST

**Terminal 1 — MUST complete before Step 2b**

```bash
cd /Users/bezhomatiashvili/Desktop/Sxarti
git checkout admin/split-10-foundation
claude
```

Inside Claude Code:

```
Read .claude/prompts/split-10-admin-foundation.md and execute all instructions.
```

Wait for DONE. Then merge and create page branches:

```bash
git checkout main
git merge admin/split-10-foundation --no-edit

# Create all page branches from updated main
git checkout -b admin/split-11-overview && git checkout main
git checkout -b admin/split-12-businesses && git checkout main
git checkout -b admin/split-13-billing && git checkout main
git checkout -b admin/split-14-bot-monitor && git checkout main
git checkout -b admin/split-15-cms && git checkout main
git checkout -b admin/split-16-feature-flags && git checkout main
git checkout -b admin/split-17-support && git checkout main
git checkout -b admin/split-18-health-settings && git checkout main
```

## Step 2b: Run Page Agents IN PARALLEL (8 terminals)

**Terminal 1 — Dashboard Overview**

```bash
cd /Users/bezhomatiashvili/Desktop/Sxarti
git checkout admin/split-11-overview
claude
```

Prompt: `Read .claude/prompts/split-11-admin-dashboard-overview.md and execute all instructions.`

**Terminal 2 — Business Directory**

```bash
cd /Users/bezhomatiashvili/Desktop/Sxarti
git checkout admin/split-12-businesses
claude
```

Prompt: `Read .claude/prompts/split-12-admin-business-directory.md and execute all instructions.`

**Terminal 3 — Subscriptions & Billing**

```bash
cd /Users/bezhomatiashvili/Desktop/Sxarti
git checkout admin/split-13-billing
claude
```

Prompt: `Read .claude/prompts/split-13-admin-subscriptions-billing.md and execute all instructions.`

**Terminal 4 — Bot Monitor**

```bash
cd /Users/bezhomatiashvili/Desktop/Sxarti
git checkout admin/split-14-bot-monitor
claude
```

Prompt: `Read .claude/prompts/split-14-admin-bot-monitor.md and execute all instructions.`

**Terminal 5 — Website CMS**

```bash
cd /Users/bezhomatiashvili/Desktop/Sxarti
git checkout admin/split-15-cms
claude
```

Prompt: `Read .claude/prompts/split-15-admin-website-cms.md and execute all instructions.`

**Terminal 6 — Feature Flags**

```bash
cd /Users/bezhomatiashvili/Desktop/Sxarti
git checkout admin/split-16-feature-flags
claude
```

Prompt: `Read .claude/prompts/split-16-admin-feature-flags.md and execute all instructions.`

**Terminal 7 — Support Tickets**

```bash
cd /Users/bezhomatiashvili/Desktop/Sxarti
git checkout admin/split-17-support
claude
```

Prompt: `Read .claude/prompts/split-17-admin-support-tickets.md and execute all instructions.`

**Terminal 8 — System Health + Settings**

```bash
cd /Users/bezhomatiashvili/Desktop/Sxarti
git checkout admin/split-18-health-settings
claude
```

Prompt: `Read .claude/prompts/split-18-admin-system-health-settings.md and execute all instructions.`

## Step 3: Merge After ALL Agents Finish

Merge order: smallest changes first, largest last.

```bash
cd /Users/bezhomatiashvili/Desktop/Sxarti
git checkout main

# 1. Feature Flags (smallest — ~6 components)
git merge admin/split-16-feature-flags --no-edit

# 2. System Health + Settings (~12 components but straightforward)
git merge admin/split-18-health-settings --no-edit

# 3. Dashboard Overview (~7 components)
git merge admin/split-11-overview --no-edit

# 4. Bot Monitor (~8 components)
git merge admin/split-14-bot-monitor --no-edit

# 5. Subscriptions & Billing (~7 components)
git merge admin/split-13-billing --no-edit

# 6. Business Directory (~6 components + detail page)
git merge admin/split-12-businesses --no-edit

# 7. Support Tickets (~9 components + detail page)
git merge admin/split-17-support --no-edit

# 8. Website CMS (largest — ~12 components with block editor)
git merge admin/split-15-cms --no-edit

# Final build verification
npm run build
```

## Step 4: Cleanup

```bash
git branch -d admin/split-10-foundation
git branch -d admin/split-11-overview
git branch -d admin/split-12-businesses
git branch -d admin/split-13-billing
git branch -d admin/split-14-bot-monitor
git branch -d admin/split-15-cms
git branch -d admin/split-16-feature-flags
git branch -d admin/split-17-support
git branch -d admin/split-18-health-settings
```

## New Files Created (~75 files)

```
supabase/migrations/20260323000011_create_admin_tables.sql
src/types/admin.ts
src/lib/admin/auth.ts
src/app/admin/layout.tsx
src/app/admin/page.tsx
src/components/admin/admin-sidebar.tsx
src/components/admin/admin-navbar.tsx
src/components/admin/admin-stat-card.tsx
src/app/admin/overview/page.tsx
src/components/admin/overview/*.tsx (6 files)
src/app/admin/businesses/page.tsx
src/app/admin/businesses/[id]/page.tsx
src/components/admin/businesses/*.tsx (4 files)
src/app/admin/billing/page.tsx
src/components/admin/billing/*.tsx (6 files)
src/app/admin/bot-monitor/page.tsx
src/components/admin/bot-monitor/*.tsx (7 files)
src/app/admin/cms/page.tsx
src/app/admin/cms/[slug]/page.tsx
src/components/admin/cms/*.tsx (4 files)
src/components/admin/cms/blocks/*.tsx (6 files)
src/app/admin/feature-flags/page.tsx
src/components/admin/feature-flags/*.tsx (5 files)
src/app/admin/support/page.tsx
src/app/admin/support/[id]/page.tsx
src/components/admin/support/*.tsx (7 files)
src/app/admin/system-health/page.tsx
src/components/admin/system-health/*.tsx (5 files)
src/app/admin/settings/page.tsx
src/components/admin/settings/*.tsx (5 files)
```

## Existing Files Modified (1 file)

```
src/middleware.ts — add /admin route protection + admin_users check
```

## Database Tables Added (7 tables)

| Table                     | Purpose                              |
| ------------------------- | ------------------------------------ |
| `admin_users`             | Platform admin accounts with roles   |
| `support_tickets`         | Support ticket tracking              |
| `support_ticket_messages` | Ticket conversation threads          |
| `feature_flags`           | Feature flag definitions + targeting |
| `cms_pages`               | Website content management           |
| `system_health_checks`    | Service health snapshots             |
| `audit_log`               | Admin action audit trail             |

## Deferred Items

| Item                            | Reason                                                                      |
| ------------------------------- | --------------------------------------------------------------------------- |
| Stitch design screen downloads  | No `STITCH_API_KEY` configured — set env var and fetch designs to refine UI |
| Design System page              | Reference/documentation page — build after all components exist             |
| Email notifications for tickets | Requires email service integration (e.g., Resend, SendGrid)                 |
| Real-time health checks         | Requires cron job or Supabase Edge Function for periodic checks             |
| Stripe/payment integration      | Billing page is UI-only; real payment processing needs Stripe setup         |
| Mobile responsive refinements   | Desktop-first; refine from Stitch mobile designs after API key setup        |
