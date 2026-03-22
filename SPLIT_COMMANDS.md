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
echo "✓ Merged auth"

# 2. Onboarding (6 files)
git merge feature/split-3-onboarding
echo "✓ Merged onboarding"

# 3. Dashboard Overview + Analytics (~12 files)
git merge feature/split-4-dashboard-charts
echo "✓ Merged dashboard charts"

# 4. Products + Orders (~8 files)
git merge feature/split-5-products-orders
echo "✓ Merged products & orders"

# 5. Conversations + Settings (~12 files)
git merge feature/split-6-conversations-settings
echo "✓ Merged conversations & settings"

# 6. AI Bot + Webhooks (~12 files)
git merge feature/split-7-ai-bot
echo "✓ Merged AI bot"

# 7. Notifications + Marketing (~10 files) — largest
git merge feature/split-8-notifications-marketing
echo "✓ Merged notifications & marketing"

# Final build verification
npm run build
echo "🎉 All agents merged successfully!"
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
