# CLAUDE.md

## WHAT — Tech Stack

- Next.js, React, TypeScript
- Supabase (Auth, DB, Storage, Edge Functions, Realtime)
- Tailwind CSS
- Key dirs: app/ (pages+API), components/, hooks/, lib/, supabase/

## WHY — Project Purpose

Sxarti — AI-powered sales automation SaaS for Georgian small businesses. Customers chat via Facebook Messenger / Instagram, an AI bot (Gemini) handles the full sales flow in Georgian, and business owners manage orders from a dashboard. Revenue: monthly subscriptions (Starter ₾49, Business ₾149, Premium ₾299).

## HOW — Workflows

### Commands

- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Start: `npm run start`

### Accounts & Infrastructure

- **GitHub:** `matiashvilibeji-svg` (SSH alias: `github-svg`)
- **Remote:** `git@github-svg:matiashvilibeji-svg/Sxarti.git`
- **Supabase Project ID:** `ablvormhhqcjuoczlzng`
- **Supabase URL:** `https://ablvormhhqcjuoczlzng.supabase.co`
- Always use project ID `ablvormhhqcjuoczlzng` when calling Supabase MCP tools

### Git

- Push using SSH alias: `git push origin main`
- Never force push (blocked by hook)

### Conventions

- Always use Context7 MCP for library documentation without being asked
- Use frontend-design skill for all UI/frontend work
- Run /code-review before merging any PR
- After fixing any bug or learning something new, suggest updating CLAUDE.md
- When receiving a vague prompt, use the prompt-optimizer skill to rewrite it before executing
- Prefer Plan mode (Shift+Tab) for complex features before implementing
- Use /clear between unrelated tasks to reset context
- Run /compact manually at 50% context usage rather than waiting for auto-compaction
- For long prompts: save to .claude/prompts/ and reference the file to avoid bash newline issues
- If task involves Supabase migrations, always check RLS policies on new tables
- Verify against live DB state, not migration files, when assessing RLS or schema

### Progressive Disclosure

- For Supabase schema: see supabase/migrations/ directory
- For security patterns: see docs/SECURITY.md (create after first audit)
