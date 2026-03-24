import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForToken } from "@/lib/facebook/oauth";
import {
  getAdAccounts,
  exchangeForLongLivedToken,
  getAdsOAuthUrl,
} from "@/lib/facebook/ads-api";

const GRAPH_API = "https://graph.facebook.com/v19.0";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const redirectUri = `${baseUrl}/api/ads/connect`;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // If no code, redirect to OAuth
  if (!code) {
    const oauthUrl = getAdsOAuthUrl(redirectUri, user.id);
    return NextResponse.redirect(oauthUrl);
  }

  // Validate state matches current user (CSRF protection)
  if (state !== user.id) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/ads-analytics?error=invalid_state`,
    );
  }

  // Exchange code for token
  try {
    const shortToken = await exchangeCodeForToken(code, redirectUri);
    const longToken = await exchangeForLongLivedToken(shortToken);

    // Fetch Facebook user ID for storage
    const meRes = await fetch(
      `${GRAPH_API}/me?fields=id&access_token=${longToken}`,
    );
    const meData = meRes.ok ? await meRes.json() : { id: "unknown" };

    // Fetch ad accounts
    const adAccounts = await getAdAccounts(longToken);
    if (adAccounts.length === 0) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/ads-analytics?error=no_accounts`,
      );
    }

    // Use the first active ad account
    const account = adAccounts[0];

    // Get tenant
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!tenant) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/ads-analytics?error=no_tenant`,
      );
    }

    // Upsert ad account connection
    const { error: upsertError } = await supabase
      .from("meta_ad_accounts")
      .upsert(
        {
          tenant_id: tenant.id,
          meta_user_id: meData.id,
          ad_account_id: account.account_id,
          access_token: longToken,
          account_name: account.name,
        },
        { onConflict: "tenant_id" },
      );

    if (upsertError) {
      console.error("Failed to save ad account:", upsertError);
      return NextResponse.redirect(
        `${baseUrl}/dashboard/ads-analytics?error=save_failed`,
      );
    }

    return NextResponse.redirect(
      `${baseUrl}/dashboard/ads-analytics?connected=true`,
    );
  } catch (error) {
    console.error("Ad account connection failed:", error);
    return NextResponse.redirect(
      `${baseUrl}/dashboard/ads-analytics?error=connection_failed`,
    );
  }
}
