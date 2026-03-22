# Agent 2: Auth Pages (Login & Signup)

## Mission

Build the login and signup pages for Sxarti. All text must be in Georgian. Follow Stitch designs exactly.

## YOUR Files (create these)

- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/signup/page.tsx`

## Context

- Auth uses Supabase Auth (email/password + optional Facebook OAuth)
- After signup → create a tenant record → redirect to onboarding `/step-1`
- After login → redirect to `/dashboard/overview`
- All UI text in Georgian
- Import shared components from `src/components/ui/` and `src/components/shared/`
- Import Supabase clients from `src/lib/supabase/`
- Import types from `src/types/`

## Stitch MCP — Fetch Designs First

1. Fetch Sign Up screen: `mcp__stitch__get_screen` with project_id `12084308622143530029`, screen_id `a09e2ce39a604cc2a7dedf0bfa0e2910`
2. Fetch Log In screen: `mcp__stitch__get_screen` with project_id `12084308622143530029`, screen_id `495832f0dc524f319dfeaf899cc852f0`
3. Match the design pixel-perfectly

## Functional Requirements

### Login Page (`/login`)

- Email input with Georgian placeholder
- Password input with show/hide toggle
- "შესვლა" (Login) button
- "პაროლი დაგავიწყდა?" (Forgot password?) link
- "რეგისტრაცია" (Sign up) link to `/signup`
- Optional: Facebook OAuth login button
- Error messages in Georgian (e.g., "ელ-ფოსტა ან პაროლი არასწორია")
- On success → redirect to `/dashboard/overview`
- Use Supabase `signInWithPassword`

### Signup Page (`/signup`)

- Business name input
- Email input
- Password input (min 8 chars)
- Confirm password
- "რეგისტრაცია" (Register) button
- "უკვე გაქვთ ანგარიში? შესვლა" link to `/login`
- On success:
  1. Create auth user via Supabase `signUp`
  2. Create tenant record in `tenants` table with `owner_id = user.id` and `business_name`
  3. Set `trial_ends_at` to 14 days from now
  4. Redirect to `/step-1` (onboarding)
- Validation errors in Georgian

## DO NOT Touch (owned by other agents)

- Any file outside `src/app/(auth)/login/` and `src/app/(auth)/signup/`
- `src/app/(auth)/layout.tsx` — already created by Agent 1
- `src/components/ui/*` — already created by Agent 1
- `src/lib/supabase/*` — already created by Agent 1

## Georgian UI Text Reference

- შესვლა = Login
- რეგისტრაცია = Register/Sign up
- ელ-ფოსტა = Email
- პაროლი = Password
- პაროლის დადასტურება = Confirm password
- ბიზნესის სახელი = Business name
- პაროლი დაგავიწყდა? = Forgot password?
- უკვე გაქვთ ანგარიში? = Already have an account?

## Completion

1. Run `npm run build` — must pass
2. Commit: "feat: add auth pages — login and signup with Georgian UI"
3. Output DONE
