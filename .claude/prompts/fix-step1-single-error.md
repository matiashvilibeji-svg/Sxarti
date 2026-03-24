Fix "Cannot coerce the result to a single JSON object" error on /step-1.

Root cause: src/hooks/use-tenant.ts:28 uses .single() which throws when the logged-in user has NO tenant row yet (new user starting onboarding).

Fix plan:

1. In src/hooks/use-tenant.ts line 28, change .single() to .maybeSingle() so it returns null (no error) when 0 rows match.

2. In src/app/(onboarding)/step-1/page.tsx, when tenant is null (new user, no error), show the form with empty defaults and INSERT a new tenant on submit instead of UPDATE. Currently the page treats !tenant as a fatal error (line 186). Changes needed:
   - Remove the tenantError || !tenant error screen - only show error on actual tenantError
   - In handleSubmit: if tenant is null, do an INSERT into tenants with owner_id = user.id; otherwise UPDATE as before
   - After successful INSERT, set the tenant state so subsequent saves use UPDATE

3. Verify other .single() calls in step-3 and step-4 - check if they also need .maybeSingle() to handle missing data gracefully.

Success criteria:

- New user can load /step-1 without error and fill in the form
- Existing user with a tenant still sees pre-filled data
- Submitting creates or updates the tenant correctly
- Steps 2-5 continue to work for existing users
