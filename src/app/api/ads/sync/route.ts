import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchCampaigns,
  fetchAdSets,
  fetchAds,
  fetchInsights,
  fetchDemographicInsights,
  MetaApiError,
} from "@/lib/facebook/ads-api";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { tenant_id: string; date_from: string; date_to: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tenant_id, date_from, date_to } = body;
  if (!tenant_id || !date_from || !date_to) {
    return NextResponse.json(
      { error: "tenant_id, date_from, and date_to are required" },
      { status: 400 },
    );
  }

  // Verify tenant ownership
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, subscription_plan")
    .eq("id", tenant_id)
    .eq("owner_id", user.id)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // NOTE: premium gate temporarily disabled — all plans can sync
  // if (tenant.subscription_plan !== "premium") {
  //   return NextResponse.json(
  //     { error: "Premium subscription required" },
  //     { status: 403 },
  //   );
  // }

  // Get ad account
  const { data: adAccount } = await supabase
    .from("meta_ad_accounts")
    .select("*")
    .eq("tenant_id", tenant_id)
    .single();

  if (!adAccount) {
    return NextResponse.json(
      { error: "No ad account connected" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  try {
    // Strip act_ prefix if present — API functions add it
    const accountId = adAccount.ad_account_id.replace(/^act_/, "");
    const token = adAccount.access_token;

    // Fetch all data from Meta API
    const [campaigns, adSets, adsList, insights, demographics] =
      await Promise.all([
        fetchCampaigns(accountId, token),
        fetchAdSets(accountId, token),
        fetchAds(accountId, token),
        fetchInsights(accountId, token, date_from, date_to, "campaign"),
        fetchDemographicInsights(accountId, token, date_from, date_to).catch(
          () => [],
        ),
      ]);

    // Upsert campaigns
    if (campaigns.length > 0) {
      const campaignRows = campaigns.map((c) => ({
        tenant_id,
        ad_account_id: adAccount.id,
        meta_campaign_id: c.id,
        name: c.name,
        status: c.status,
        objective: c.objective ?? null,
        daily_budget: c.daily_budget ? parseFloat(c.daily_budget) / 100 : null,
        lifetime_budget: c.lifetime_budget
          ? parseFloat(c.lifetime_budget) / 100
          : null,
        updated_at: new Date().toISOString(),
      }));

      await admin.from("ad_campaigns").upsert(campaignRows, {
        onConflict: "tenant_id,meta_campaign_id",
      });
    }

    // Get campaign ID mapping
    const { data: dbCampaigns } = await admin
      .from("ad_campaigns")
      .select("id, meta_campaign_id")
      .eq("tenant_id", tenant_id);

    const campaignMap = new Map(
      (dbCampaigns ?? []).map((c) => [c.meta_campaign_id, c.id]),
    );

    // Upsert ad sets
    if (adSets.length > 0) {
      const adSetRows = adSets
        .filter((as) => campaignMap.has(as.campaign_id))
        .map((as) => ({
          tenant_id,
          campaign_id: campaignMap.get(as.campaign_id)!,
          meta_adset_id: as.id,
          name: as.name,
          status: as.status,
          targeting: as.targeting ?? null,
          updated_at: new Date().toISOString(),
        }));

      if (adSetRows.length > 0) {
        await admin
          .from("ad_sets")
          .upsert(adSetRows, { onConflict: "tenant_id,meta_adset_id" });
      }
    }

    // Get ad set ID mapping
    const { data: dbAdSets } = await admin
      .from("ad_sets")
      .select("id, meta_adset_id")
      .eq("tenant_id", tenant_id);

    const adSetMap = new Map(
      (dbAdSets ?? []).map((as) => [as.meta_adset_id, as.id]),
    );

    // Upsert ads
    if (adsList.length > 0) {
      const adRows = adsList
        .filter((a) => adSetMap.has(a.adset_id))
        .map((a) => ({
          tenant_id,
          adset_id: adSetMap.get(a.adset_id)!,
          meta_ad_id: a.id,
          name: a.name,
          status: a.status,
          creative_thumbnail_url: a.creative?.thumbnail_url ?? null,
          creative_type: null,
          updated_at: new Date().toISOString(),
        }));

      if (adRows.length > 0) {
        await admin
          .from("ads")
          .upsert(adRows, { onConflict: "tenant_id,meta_ad_id" });
      }
    }

    // Build demographic breakdowns from separate query
    // Demographics are keyed by campaign_id for aggregation
    const ageByC: Record<string, Record<string, number>> = {};
    const genderByC: Record<string, Record<string, number>> = {};
    for (const d of demographics) {
      if (!d.campaign_id) continue;
      const imp = parseInt(d.impressions) || 0;
      // Meta returns age and gender as part of the breakdown row
      const raw = d as unknown as Record<string, string>;
      const age = raw["age"];
      const gender = raw["gender"];
      if (age) {
        if (!ageByC[d.campaign_id]) ageByC[d.campaign_id] = {};
        ageByC[d.campaign_id][age] = (ageByC[d.campaign_id][age] || 0) + imp;
      }
      if (gender) {
        if (!genderByC[d.campaign_id]) genderByC[d.campaign_id] = {};
        genderByC[d.campaign_id][gender] =
          (genderByC[d.campaign_id][gender] || 0) + imp;
      }
    }

    // Process and store insights (campaign-level daily metrics)
    if (insights.length > 0) {
      const metricRows = insights
        .filter((i) => i.campaign_id && campaignMap.has(i.campaign_id))
        .map((i) => {
          const conversions =
            i.actions?.find(
              (a) =>
                a.action_type === "offsite_conversion" ||
                a.action_type === "purchase",
            )?.value ?? "0";
          const roas =
            i.purchase_roas?.find((r) => r.action_type === "omni_purchase")
              ?.value ?? "0";

          return {
            tenant_id,
            campaign_id: campaignMap.get(i.campaign_id!)!,
            adset_id: null,
            ad_id: null,
            date: i.date_start,
            impressions: parseInt(i.impressions) || 0,
            clicks: parseInt(i.clicks) || 0,
            spend: parseFloat(i.spend) || 0,
            conversions: parseInt(conversions) || 0,
            reach: parseInt(i.reach) || 0,
            ctr: parseFloat(i.ctr) || 0,
            cpc: parseFloat(i.cpc) || 0,
            cpm: parseFloat(i.cpm) || 0,
            roas: parseFloat(roas) || 0,
            age_breakdown: ageByC[i.campaign_id!] ?? null,
            gender_breakdown: genderByC[i.campaign_id!] ?? null,
          };
        });

      if (metricRows.length > 0) {
        // Delete existing metrics for this date range then insert fresh
        await admin
          .from("ad_metrics")
          .delete()
          .eq("tenant_id", tenant_id)
          .gte("date", date_from)
          .lte("date", date_to);

        await admin.from("ad_metrics").insert(metricRows);
      }
    }

    // Update last synced timestamp
    await admin
      .from("meta_ad_accounts")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", adAccount.id);

    return NextResponse.json({
      success: true,
      synced: {
        campaigns: campaigns.length,
        adSets: adSets.length,
        ads: adsList.length,
        metrics: insights.length,
      },
    });
  } catch (error) {
    console.error("Sync failed:", error);

    if (error instanceof MetaApiError && error.isTokenExpired) {
      return NextResponse.json(
        {
          error:
            "Facebook ტოკენს ვადა გაუვიდა. გთხოვ, ხელახლა დააკავშირე ანგარიში.",
          code: "token_expired",
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        error: "Sync failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
