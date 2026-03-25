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
