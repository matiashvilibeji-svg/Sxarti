# Facebook Manual Connect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the non-functional Facebook OAuth connection with a manual Page ID + Access Token entry flow, including server-side webhook subscription and a working disconnect feature.

**Architecture:** Client sends credentials to a server API route that validates against Facebook Graph API, subscribes the page to webhooks via `subscribePage()`, and upserts credentials on the `tenants` table. Disconnect clears the credentials via a separate API route. UI follows the ads `connect-screen.tsx` pattern.

**Tech Stack:** Next.js API routes, Supabase server client, Facebook Graph API v19.0, React, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-25-facebook-manual-connect-design.md`

---

## File Structure

| File                                       | Action | Responsibility                                                                 |
| ------------------------------------------ | ------ | ------------------------------------------------------------------------------ |
| `src/app/api/facebook/connect/route.ts`    | Create | POST: authenticate, validate FB credentials, subscribe webhook, upsert tenants |
| `src/app/api/facebook/disconnect/route.ts` | Create | POST: authenticate, clear facebook_page_id + facebook_access_token on tenants  |
| `src/app/dashboard/settings/page.tsx`      | Modify | Replace `ConnectionsTab` function (~lines 361-422) with manual entry form      |

---

### Task 1: Create Facebook Connect API Route

**Files:**

- Create: `src/app/api/facebook/connect/route.ts`
- Reference: `src/app/api/ads/connect/route.ts` (auth pattern), `src/lib/facebook/oauth.ts` (subscribePage)

- [ ] **Step 1: Create the connect route file**

```typescript
// src/app/api/facebook/connect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { subscribePage } from "@/lib/facebook/oauth";

const GRAPH_API = "https://graph.facebook.com/v19.0";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pageId, accessToken } = await request.json();

  if (!pageId?.trim() || !accessToken?.trim()) {
    return NextResponse.json(
      { error: "pageId and accessToken are required" },
      { status: 400 },
    );
  }

  const trimmedPageId = pageId.trim();
  const trimmedToken = accessToken.trim();

  try {
    // 1. Validate token
    const meRes = await fetch(`${GRAPH_API}/me?access_token=${trimmedToken}`);
    if (!meRes.ok) {
      return NextResponse.json(
        { error: "invalid_token", message: "Access Token არავალიდურია" },
        { status: 400 },
      );
    }

    // 2. Validate page access
    const pageRes = await fetch(
      `${GRAPH_API}/${trimmedPageId}?fields=name&access_token=${trimmedToken}`,
    );
    if (!pageRes.ok) {
      return NextResponse.json(
        {
          error: "invalid_page",
          message: "Page ID არასწორია ან ტოკენს არ აქვს წვდომა",
        },
        { status: 400 },
      );
    }
    const pageData = await pageRes.json();

    // 3. Get tenant for this user
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!tenant) {
      return NextResponse.json(
        { error: "no_tenant", message: "ტენანტი ვერ მოიძებნა" },
        { status: 400 },
      );
    }

    // 4. Check uniqueness — no other tenant should use this page
    const { data: existing } = await supabase
      .from("tenants")
      .select("id")
      .eq("facebook_page_id", trimmedPageId)
      .neq("id", tenant.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error: "duplicate_page",
          message: "ეს გვერდი უკვე დაკავშირებულია სხვა ანგარიშთან",
        },
        { status: 409 },
      );
    }

    // 5. Subscribe page to webhook
    await subscribePage(trimmedPageId, trimmedToken);

    // 6. Update tenant
    const { error: updateError } = await supabase
      .from("tenants")
      .update({
        facebook_page_id: trimmedPageId,
        facebook_access_token: trimmedToken,
      })
      .eq("id", tenant.id);

    if (updateError) {
      return NextResponse.json(
        { error: "db_error", message: "მონაცემების შენახვა ვერ მოხერხდა" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      pageName: pageData.name || trimmedPageId,
    });
  } catch (error) {
    console.error("Facebook connect error:", error);
    return NextResponse.json(
      { error: "server_error", message: "სერვერთან კავშირი ვერ მოხერხდა" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx tsc --noEmit src/app/api/facebook/connect/route.ts 2>&1 || npm run build 2>&1 | head -30`
Expected: No type errors related to this file

- [ ] **Step 3: Commit**

```bash
git add src/app/api/facebook/connect/route.ts
git commit -m "feat: add Facebook page connect API route with auth and validation"
```

---

### Task 2: Create Facebook Disconnect API Route

**Files:**

- Create: `src/app/api/facebook/disconnect/route.ts`

- [ ] **Step 1: Create the disconnect route file**

```typescript
// src/app/api/facebook/disconnect/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!tenant) {
    return NextResponse.json(
      { error: "no_tenant", message: "ტენანტი ვერ მოიძებნა" },
      { status: 400 },
    );
  }

  const { error: updateError } = await supabase
    .from("tenants")
    .update({
      facebook_page_id: null,
      facebook_access_token: null,
    })
    .eq("id", tenant.id);

  if (updateError) {
    return NextResponse.json(
      { error: "db_error", message: "გათიშვა ვერ მოხერხდა" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Verify compiles**

Run: `npm run build 2>&1 | tail -10`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/api/facebook/disconnect/route.ts
git commit -m "feat: add Facebook page disconnect API route"
```

---

### Task 3: Replace ConnectionsTab UI with Manual Entry Form

**Files:**

- Modify: `src/app/dashboard/settings/page.tsx` (lines 359-423, the `ConnectionsTab` function)
- Reference: `src/components/dashboard/ads/connect-screen.tsx` (UI pattern)

**Important context:**

- The `ConnectionsTab` receives `{ tenant }` prop (type `Tenant`)
- The parent `SettingsPage` does NOT pass `setTenant` to `ConnectionsTab` currently — you'll need to add it
- `useTenant()` hook returns `{ tenant, setTenant, loading, error }` — the `setTenant` callback updates both state and sessionStorage cache
- Imports already available in the file: `Input`, `Label`, `Button`, `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`, `Dialog`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogTitle`, `useToast`, `useSupabase`, `useTenant`
- You need to add imports: `Loader2`, `ExternalLink` from lucide-react (already imported: `Link2`)

- [ ] **Step 1: Update ConnectionsTab props and parent call**

In `SettingsPage` (line 128-129), change:

```tsx
// FROM:
<ConnectionsTab tenant={tenant} />
// TO:
<ConnectionsTab tenant={tenant} setTenant={setTenant} />
```

Update the `ConnectionsTab` function signature (line 361):

```tsx
// FROM:
function ConnectionsTab({ tenant }: { tenant: Tenant }) {
// TO:
function ConnectionsTab({
  tenant,
  setTenant,
}: {
  tenant: Tenant;
  setTenant: (t: Tenant | null) => void;
}) {
```

- [ ] **Step 2: Add needed imports**

Add `Loader2` and `ExternalLink` to the lucide-react import (the import is at the top of the file, around lines 37-49). These are already imported in other components so they're available.

- [ ] **Step 3: Replace the ConnectionsTab function body**

Replace the entire `ConnectionsTab` function body (lines 361-423) with:

```tsx
function ConnectionsTab({
  tenant,
  setTenant,
}: {
  tenant: Tenant;
  setTenant: (t: Tenant | null) => void;
}) {
  const { toast } = useToast();
  const [pageId, setPageId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  const handleConnect = async () => {
    if (!pageId.trim() || !accessToken.trim()) return;

    setConnecting(true);
    try {
      const res = await fetch("/api/facebook/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: pageId.trim(),
          accessToken: accessToken.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "შეცდომა",
          description: data.message || "დაკავშირება ვერ მოხერხდა",
          variant: "destructive",
        });
        return;
      }

      // Update tenant state with new facebook fields
      setTenant({
        ...tenant,
        facebook_page_id: pageId.trim(),
        facebook_access_token: accessToken.trim(),
      });
      setPageId("");
      setAccessToken("");
      toast({
        title: "წარმატებით დაკავშირდა",
        description: `${data.pageName} — Facebook გვერდი დაკავშირებულია`,
      });
    } catch {
      toast({
        title: "შეცდომა",
        description: "სერვერთან კავშირი ვერ მოხერხდა",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/facebook/disconnect", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "შეცდომა",
          description: data.message || "გათიშვა ვერ მოხერხდა",
          variant: "destructive",
        });
        return;
      }

      setTenant({
        ...tenant,
        facebook_page_id: null,
        facebook_access_token: null,
      });
      setShowDisconnectDialog(false);
      toast({
        title: "გათიშულია",
        description: "Facebook გვერდი გათიშულია",
      });
    } catch {
      toast({
        title: "შეცდომა",
        description: "სერვერთან კავშირი ვერ მოხერხდა",
        variant: "destructive",
      });
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Facebook Messenger Connection */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base">Facebook Messenger</CardTitle>
          <CardDescription>დააკავშირეთ Facebook გვერდი ბოტთან</CardDescription>
        </CardHeader>
        <CardContent>
          {tenant.facebook_page_id ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-on-surface">
                  დაკავშირებულია
                </p>
                <p className="text-xs text-on-surface-variant/60">
                  Page ID: {tenant.facebook_page_id}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => setShowDisconnectDialog(true)}
              >
                გათიშვა
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fb-page-id" className="text-sm font-semibold">
                  Page ID
                </Label>
                <Input
                  id="fb-page-id"
                  placeholder="123456789012345"
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                />
                <p className="text-xs text-on-surface-variant">
                  იპოვე{" "}
                  <a
                    href="https://www.facebook.com/settings/?tab=pages"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-primary underline"
                  >
                    Facebook Business Settings-ში
                    <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  → Page ID
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="fb-access-token"
                  className="text-sm font-semibold"
                >
                  Page Access Token
                </Label>
                <Input
                  id="fb-access-token"
                  type="password"
                  placeholder="EAAxxxxxxxxx..."
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
                <p className="text-xs text-on-surface-variant">
                  შექმენი{" "}
                  <a
                    href="https://developers.facebook.com/tools/explorer/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-primary underline"
                  >
                    Graph API Explorer-ში
                    <ExternalLink className="h-3 w-3" />
                  </a>{" "}
                  → აირჩიე pages_messaging permission
                </p>
              </div>

              <Button
                onClick={handleConnect}
                disabled={connecting || !pageId.trim() || !accessToken.trim()}
                className="w-full bg-[#1877F2] text-white hover:bg-[#1668d9]"
              >
                {connecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg
                    className="mr-2 h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                )}
                {connecting ? "მიმდინარეობს..." : "დაკავშირება"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instagram (unchanged placeholder) */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base">Instagram</CardTitle>
          <CardDescription>
            დააკავშირეთ Instagram ბიზნეს ანგარიში
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tenant.instagram_account_id ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-on-surface">
                  დაკავშირებულია
                </p>
                <p className="text-xs text-on-surface-variant/60">
                  Account ID: {tenant.instagram_account_id}
                </p>
              </div>
              <Button variant="outline" size="sm" className="text-destructive">
                გათიშვა
              </Button>
            </div>
          ) : (
            <Button className="bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white hover:opacity-90">
              Instagram-ის დაკავშირება
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Disconnect confirmation dialog */}
      <Dialog
        open={showDisconnectDialog}
        onOpenChange={setShowDisconnectDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Facebook გვერდის გათიშვა</DialogTitle>
            <DialogDescription>
              დარწმუნებული ხართ? გათიშვის შემდეგ ბოტი ვეღარ მიიღებს
              შეტყობინებებს ამ გვერდიდან.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDisconnectDialog(false)}
            >
              გაუქმება
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {disconnecting ? "მიმდინარეობს..." : "გათიშვა"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 4: Build and verify**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds with 0 errors

- [ ] **Step 5: Lint check**

Run: `npm run lint 2>&1 | tail -10`
Expected: No new warnings

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/settings/page.tsx
git commit -m "feat: replace Facebook OAuth connection with manual key entry form"
```

---

### Task 4: Final Build Verification

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: Compiles successfully, all static pages generated

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: No new warnings introduced

- [ ] **Step 3: Final commit (if any fixes needed)**

If build or lint required fixes, commit them:

```bash
git add -A
git commit -m "fix: resolve build/lint issues from Facebook connect implementation"
```
