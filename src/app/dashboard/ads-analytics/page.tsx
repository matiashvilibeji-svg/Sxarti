"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useTenant } from "@/hooks/use-tenant";
import { useSupabase } from "@/hooks/use-supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { PremiumGate } from "@/components/dashboard/ads/premium-gate";
import { ConnectScreen } from "@/components/dashboard/ads/connect-screen";
import { StatsRow } from "@/components/dashboard/ads/stats-row";
import { AIBanner } from "@/components/dashboard/ads/ai-banner";
import { CampaignTable } from "@/components/dashboard/ads/campaign-table";
import { RecommendationsList } from "@/components/dashboard/ads/recommendations-list";
import { SxartiInsights } from "@/components/dashboard/ads/sxarti-insights";
import { AudienceBreakdown } from "@/components/dashboard/ads/audience-breakdown";
import { TopCreatives } from "@/components/dashboard/ads/top-creatives";
import { FooterActionBar } from "@/components/dashboard/ads/footer-action-bar";
import { RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ka } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import type {
  MetaAdAccount,
  AdCampaign,
  AdSet,
  AdMetrics,
  AdRecommendation,
  Ad,
} from "@/types/database";

const PerformanceChart = dynamic(
  () =>
    import("@/components/dashboard/ads/performance-chart").then(
      (m) => m.PerformanceChart,
    ),
  { ssr: false, loading: () => <Skeleton className="h-80" /> },
);

const periods = [
  { value: "7d", label: "7 დღე", days: 7 },
  { value: "30d", label: "30 დღე", days: 30 },
  { value: "90d", label: "90 დღე", days: 90 },
] as const;

export default function AdsAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64" />
        </div>
      }
    >
      <AdsAnalyticsContent />
    </Suspense>
  );
}

function AdsAnalyticsContent() {
  const { tenant, loading: tenantLoading } = useTenant();
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [period, setPeriod] = useState<string>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [adAccount, setAdAccount] = useState<MetaAdAccount | null>(null);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [metrics, setMetrics] = useState<AdMetrics[]>([]);
  const [recommendations, setRecommendations] = useState<AdRecommendation[]>(
    [],
  );
  const [topAds, setTopAds] = useState<Ad[]>([]);
  const [adSets, setAdSets] = useState<
    Pick<AdSet, "id" | "campaign_id" | "name" | "status">[]
  >([]);
  const [conversationCounts, setConversationCounts] = useState<
    { date: string; count: number }[]
  >([]);
  const [peakHours, setPeakHours] = useState<[number, number]>([20, 22]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const hasLoadedOnce = useRef(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const getDateRange = useCallback(() => {
    if (period === "custom" && customFrom && customTo) {
      return { from: customFrom, to: customTo };
    }
    const days = periods.find((p) => p.value === period)?.days ?? 30;
    const dateTo = new Date();
    const dateFrom = new Date(Date.now() - days * 86400000);
    return {
      from: dateFrom.toISOString().split("T")[0],
      to: dateTo.toISOString().split("T")[0],
    };
  }, [period, customFrom, customTo]);

  const fetchData = useCallback(async () => {
    if (!tenant) return;
    if (hasLoadedOnce.current) {
      setRefetching(true);
    } else {
      setLoading(true);
    }

    const { from, to } = getDateRange();

    // Check if ad account is connected
    const { data: account } = await supabase
      .from("meta_ad_accounts")
      .select("*")
      .eq("tenant_id", tenant.id)
      .maybeSingle();

    setAdAccount(account as MetaAdAccount | null);

    if (!account) {
      setLoading(false);
      return;
    }

    // Fetch all data in parallel
    const [campaignsRes, metricsRes, recsRes, adsRes, convsRes, adSetsRes] =
      await Promise.all([
        supabase.from("ad_campaigns").select("*").eq("tenant_id", tenant.id),
        supabase
          .from("ad_metrics")
          .select("*")
          .eq("tenant_id", tenant.id)
          .gte("date", from)
          .lte("date", to)
          .is("adset_id", null)
          .is("ad_id", null),
        supabase
          .from("ad_recommendations")
          .select("*")
          .eq("tenant_id", tenant.id)
          .order("generated_at", { ascending: false }),
        supabase
          .from("ads")
          .select("*, ad_sets!inner(campaign_id)")
          .eq("tenant_id", tenant.id)
          .eq("status", "ACTIVE")
          .limit(3),
        supabase
          .from("conversations")
          .select("id, started_at")
          .eq("tenant_id", tenant.id)
          .gte("started_at", from)
          .lte("started_at", to + "T23:59:59Z"),
        supabase
          .from("ad_sets")
          .select("id, campaign_id, name, status")
          .eq("tenant_id", tenant.id),
      ]);

    setCampaigns((campaignsRes.data ?? []) as AdCampaign[]);
    setMetrics((metricsRes.data ?? []) as AdMetrics[]);
    setRecommendations((recsRes.data ?? []) as AdRecommendation[]);
    setTopAds((adsRes.data ?? []) as Ad[]);
    setAdSets(
      (adSetsRes.data ?? []) as Pick<
        AdSet,
        "id" | "campaign_id" | "name" | "status"
      >[],
    );

    // Group conversations by date and compute peak hours
    const convByDate: Record<string, number> = {};
    const hourBuckets: Record<number, number> = {};
    for (const c of convsRes.data ?? []) {
      const d = new Date(c.started_at);
      const date = d.toISOString().split("T")[0];
      convByDate[date] = (convByDate[date] || 0) + 1;
      const hour = d.getHours();
      hourBuckets[hour] = (hourBuckets[hour] || 0) + 1;
    }
    setConversationCounts(
      Object.entries(convByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    );

    // Find the 2-hour window with most conversations
    let maxSum = 0;
    let peakStart = 20;
    for (let h = 0; h < 24; h++) {
      const sum = (hourBuckets[h] || 0) + (hourBuckets[(h + 1) % 24] || 0);
      if (sum > maxSum) {
        maxSum = sum;
        peakStart = h;
      }
    }
    setPeakHours([peakStart, (peakStart + 2) % 24]);

    setLoading(false);
    setRefetching(false);
    hasLoadedOnce.current = true;
  }, [tenant, getDateRange, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle OAuth redirect params
  useEffect(() => {
    const error = searchParams.get("error");
    const connected = searchParams.get("connected");

    if (connected === "true") {
      toast({
        title: "წარმატებით დაკავშირდა",
        description:
          "Facebook Ads ანგარიში დაკავშირებულია. დააჭირე სინქრონიზაციას.",
      });
      router.replace("/dashboard/ads-analytics");
    } else if (error) {
      const messages: Record<string, string> = {
        no_accounts: "Facebook Ads ანგარიში ვერ მოიძებნა.",
        connection_failed: "დაკავშირება ვერ მოხერხდა. სცადე თავიდან.",
        save_failed: "მონაცემების შენახვა ვერ მოხერხდა.",
        invalid_state: "უსაფრთხოების შეცდომა. სცადე თავიდან.",
        no_tenant: "ბიზნესის პროფილი ვერ მოიძებნა.",
      };
      toast({
        title: "შეცდომა",
        description: messages[error] ?? "დაფიქსირდა შეცდომა.",
        variant: "destructive",
      });
      router.replace("/dashboard/ads-analytics");
    }
  }, [searchParams, toast, router]);

  const handleSync = async () => {
    if (!tenant || syncing) return;
    setSyncing(true);
    const { from, to } = getDateRange();

    try {
      const res = await fetch("/api/ads/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenant.id,
          date_from: from,
          date_to: to,
        }),
      });

      if (res.ok) {
        // Also generate recommendations
        await fetch("/api/ads/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant_id: tenant.id,
            date_from: from,
            date_to: to,
          }),
        });
        await fetchData();
        toast({
          title: "სინქრონიზაცია დასრულდა",
          description: "მონაცემები და AI რეკომენდაციები განახლდა.",
        });
      } else {
        const errorData = await res.json().catch(() => null);
        if (errorData?.code === "token_expired") {
          toast({
            title: "ტოკენს ვადა გაუვიდა",
            description:
              "Facebook Ads-ის ტოკენს ვადა გაუვიდა. გთხოვ, გათიშე და ხელახლა დააკავშირე ანგარიში.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "სინქრონიზაცია ვერ მოხერხდა",
            description: errorData?.error ?? "სცადე მოგვიანებით.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Sync failed:", error);
      toast({
        title: "შეცდომა",
        description: "სერვერთან კავშირი ვერ მოხერხდა.",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = () => {
    if (!campaigns.length) return;

    const campaignRows = buildCampaignRows();
    const header =
      "კამპანია,სტატუსი,ბიუჯეტი,დახარჯული,შთაბეჭდილებები,დაწკაპუნებები,CTR,CPC,კონვერსიები,ROAS\n";
    const rows = campaignRows
      .map(
        (c) =>
          `"${c.name}",${c.status},${c.budget},${c.spend.toFixed(2)},${c.impressions},${c.clicks},${c.ctr.toFixed(2)}%,${c.cpc.toFixed(2)},${c.conversions},${c.roas.toFixed(1)}x`,
      )
      .join("\n");

    const csv = header + rows;
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const { from, to } = getDateRange();
    a.download = `ads-report-${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDisconnect = async () => {
    if (!tenant || !adAccount || disconnecting) return;
    if (!confirm("ნამდვილად გსურს Facebook Ads ანგარიშის გათიშვა?")) return;
    setDisconnecting(true);
    try {
      const { error } = await supabase
        .from("meta_ad_accounts")
        .delete()
        .eq("id", adAccount.id)
        .eq("tenant_id", tenant.id);
      if (!error) {
        setAdAccount(null);
        setCampaigns([]);
        setMetrics([]);
        setRecommendations([]);
        hasLoadedOnce.current = false;
        toast({
          title: "ანგარიში გათიშულია",
          description: "Facebook Ads ანგარიში წარმატებით გათიშულია.",
        });
      } else {
        toast({
          title: "შეცდომა",
          description: "გათიშვა ვერ მოხერხდა.",
          variant: "destructive",
        });
      }
    } finally {
      setDisconnecting(false);
    }
  };

  // Compute derived data
  const buildCampaignRows = () => {
    return campaigns.map((c) => {
      const campaignMetrics = metrics.filter((m) => m.campaign_id === c.id);
      const spend = campaignMetrics.reduce((s, m) => s + (m.spend || 0), 0);
      const clicks = campaignMetrics.reduce((s, m) => s + (m.clicks || 0), 0);
      const impressions = campaignMetrics.reduce(
        (s, m) => s + (m.impressions || 0),
        0,
      );
      const conversions = campaignMetrics.reduce(
        (s, m) => s + (m.conversions || 0),
        0,
      );
      const avgRoas =
        campaignMetrics.length > 0
          ? campaignMetrics.reduce((s, m) => s + (m.roas || 0), 0) /
            campaignMetrics.length
          : 0;
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const cpc = clicks > 0 ? spend / clicks : 0;

      // Build ad set sub-rows for this campaign
      const campaignAdSets = adSets
        .filter((as) => as.campaign_id === c.id)
        .map((as) => ({
          id: as.id,
          name: as.name ?? "Ad Set",
          status: as.status,
        }));

      return {
        id: c.id,
        name: c.name,
        status: c.status,
        budget: (c.daily_budget || c.lifetime_budget || 0) as number,
        spend,
        impressions,
        clicks,
        ctr,
        cpc,
        conversions,
        roas: avgRoas,
        adSets: campaignAdSets,
      };
    });
  };

  const computeTrend = (getter: (m: AdMetrics) => number): number => {
    if (metrics.length < 2) return 0;
    const sorted = [...metrics].sort((a, b) => a.date.localeCompare(b.date));
    const mid = Math.floor(sorted.length / 2);
    const first = sorted.slice(0, mid).reduce((s, m) => s + getter(m), 0);
    const second = sorted.slice(mid).reduce((s, m) => s + getter(m), 0);
    if (first === 0) return second > 0 ? 100 : 0;
    return Math.round(((second - first) / Math.abs(first)) * 100);
  };

  const computeStats = () => {
    const totalSpend = metrics.reduce((s, m) => s + (m.spend || 0), 0);
    const totalImpressions = metrics.reduce(
      (s, m) => s + (m.impressions || 0),
      0,
    );
    const totalClicks = metrics.reduce((s, m) => s + (m.clicks || 0), 0);
    const totalConversions = metrics.reduce(
      (s, m) => s + (m.conversions || 0),
      0,
    );
    const avgCtr =
      totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

    return [
      {
        label: "დახარჯული",
        value: `${totalSpend.toLocaleString("ka-GE", { maximumFractionDigits: 0 })} ₾`,
        change: computeTrend((m) => m.spend || 0),
        borderColor: "border-primary",
      },
      {
        label: "შთაბეჭდილებები",
        value:
          totalImpressions >= 1000
            ? `${(totalImpressions / 1000).toFixed(1)}K`
            : totalImpressions.toString(),
        change: computeTrend((m) => m.impressions || 0),
        borderColor: "border-indigo-400",
      },
      {
        label: "დაწკაპუნებები",
        value: totalClicks.toLocaleString("ka-GE"),
        change: computeTrend((m) => m.clicks || 0),
        borderColor: "border-[#5c00ca]",
      },
      {
        label: "CTR",
        value: `${avgCtr.toFixed(2)}%`,
        change: computeTrend((m) => m.ctr || 0),
        borderColor: "border-[#006c49]",
      },
      {
        label: "ფასი/დაწკაპუნებაზე",
        value: `${avgCpc.toFixed(2)} ₾`,
        change: computeTrend((m) => m.cpc || 0),
        borderColor: "border-orange-400",
      },
      {
        label: "კონვერსიები",
        value: totalConversions.toString(),
        change: computeTrend((m) => m.conversions || 0),
        borderColor: "border-emerald-500",
      },
    ];
  };

  const computePerformanceData = () => {
    const byDate: Record<
      string,
      {
        spend: number;
        clicks: number;
        conversions: number;
        impressions: number;
      }
    > = {};
    for (const m of metrics) {
      if (!byDate[m.date]) {
        byDate[m.date] = {
          spend: 0,
          clicks: 0,
          conversions: 0,
          impressions: 0,
        };
      }
      byDate[m.date].spend += m.spend || 0;
      byDate[m.date].clicks += m.clicks || 0;
      byDate[m.date].conversions += m.conversions || 0;
      byDate[m.date].impressions += m.impressions || 0;
    }
    return Object.entries(byDate)
      .map(([date, data]) => ({
        date,
        spend: data.spend,
        clicks: data.clicks,
        conversions: data.conversions,
        ctr:
          data.impressions > 0
            ? parseFloat(((data.clicks / data.impressions) * 100).toFixed(2))
            : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const computeCorrelationData = () => {
    const spendByDate: Record<string, number> = {};
    for (const m of metrics) {
      spendByDate[m.date] = (spendByDate[m.date] || 0) + (m.spend || 0);
    }

    const convByDate = new Map(
      conversationCounts.map((c) => [c.date, c.count]),
    );

    const allDates = new Set([
      ...Object.keys(spendByDate),
      ...Array.from(convByDate.keys()),
    ]);

    return Array.from(allDates)
      .sort()
      .map((date) => ({
        date,
        spend: spendByDate[date] || 0,
        conversations: convByDate.get(date) || 0,
      }));
  };

  const computeInsights = () => {
    const totalConversations = conversationCounts.reduce(
      (s, c) => s + c.count,
      0,
    );
    const midpoint = Math.floor(conversationCounts.length / 2);
    const firstHalf = conversationCounts
      .slice(0, midpoint)
      .reduce((s, c) => s + c.count, 0);
    const secondHalf = conversationCounts
      .slice(midpoint)
      .reduce((s, c) => s + c.count, 0);
    const liftPercent =
      firstHalf > 0
        ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100)
        : 0;

    // Best campaign by highest ROAS
    let bestCampaign = "—";
    if (campaigns.length > 0) {
      const campaignPerf = campaigns.map((c) => {
        const cMetrics = metrics.filter((m) => m.campaign_id === c.id);
        const avgRoas =
          cMetrics.length > 0
            ? cMetrics.reduce((s, m) => s + (m.roas || 0), 0) / cMetrics.length
            : 0;
        return { name: c.name, roas: avgRoas };
      });
      const best = campaignPerf.sort((a, b) => b.roas - a.roas)[0];
      bestCampaign = best?.name ?? "—";
    }

    return [
      {
        label: "ეფექტურობა",
        headline: `რეკლამის შემდეგ საუბრები ${liftPercent > 0 ? "+" : ""}${liftPercent}%`,
        description:
          "AI-მ დაადგინა კავშირი აქტიურ კამპანიებსა და შემოსულ შეტყობინებებს შორის.",
      },
      {
        label: "კონვერსია",
        headline: `საუკეთესო რეკლამა → ${totalConversations} საუბარი`,
        description: `"${bestCampaign}" ყველაზე მეტ ინტერესს იწვევს მომხმარებლებში.`,
      },
      {
        label: "პიკური აქტივობა",
        headline: `${peakHours[0].toString().padStart(2, "0")}:00–${peakHours[1].toString().padStart(2, "0")}:00`,
        description:
          "ამ საათებში ყველაზე მეტი შეტყობინება შემოდის. რეკომენდებულია ბიუჯეტის კონცენტრაცია პიკურ საათებზე.",
      },
    ];
  };

  const computeAudienceData = () => {
    const ageGroups: Record<string, number> = {};
    let maleTotal = 0;
    let femaleTotal = 0;
    let total = 0;

    for (const m of metrics) {
      if (m.age_breakdown) {
        for (const [age, count] of Object.entries(m.age_breakdown)) {
          ageGroups[age] = (ageGroups[age] || 0) + (count as number);
          total += count as number;
        }
      }
      if (m.gender_breakdown) {
        maleTotal += (m.gender_breakdown["male"] as number) || 0;
        femaleTotal += (m.gender_breakdown["female"] as number) || 0;
      }
    }

    const genderTotal = maleTotal + femaleTotal;
    const sortedAges = Object.entries(ageGroups)
      .map(([label, count]) => ({
        label,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    // Default if no data
    if (sortedAges.length === 0) {
      return {
        ageGroups: [
          { label: "18-24", percentage: 22 },
          { label: "25-34", percentage: 48 },
          { label: "35-44", percentage: 15 },
          { label: "45-54", percentage: 10 },
          { label: "55+", percentage: 5 },
        ],
        malePercent: 65,
        femalePercent: 35,
      };
    }

    return {
      ageGroups: sortedAges,
      malePercent:
        genderTotal > 0 ? Math.round((maleTotal / genderTotal) * 100) : 50,
      femalePercent:
        genderTotal > 0 ? Math.round((femaleTotal / genderTotal) * 100) : 50,
    };
  };

  // Loading state
  if (tenantLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!tenant) return null;

  const dashboardContent = (
    <>
      {!adAccount ? (
        <ConnectScreen />
      ) : loading ? (
        <div className="space-y-6">
          <Skeleton className="h-20" />
          <Skeleton className="h-40 rounded-2xl" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Header with period selector and sync */}
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">
                რეკლამების ანალიზი
              </h1>
              <p className="text-sm font-medium text-on-surface-variant">
                გაანალიზე შენი Facebook და Instagram რეკლამები AI-ის დახმარებით
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="flex rounded-xl bg-surface-container-low p-1"
                role="group"
                aria-label="პერიოდის არჩევა"
              >
                {periods.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={cn(
                      "px-3 py-1.5 text-sm font-bold transition-colors",
                      period === p.value
                        ? "rounded-lg bg-white text-primary shadow-sm"
                        : "text-on-surface-variant hover:text-primary",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setPeriod("custom");
                    if (!customFrom) {
                      const d = new Date(Date.now() - 30 * 86400000);
                      setCustomFrom(d.toISOString().split("T")[0]);
                      setCustomTo(new Date().toISOString().split("T")[0]);
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 text-sm font-bold transition-colors",
                    period === "custom"
                      ? "rounded-lg bg-white text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-primary",
                  )}
                >
                  სხვა
                </button>
              </div>
              {period === "custom" && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    aria-label="საწყისი თარიღი"
                    className="rounded-lg bg-surface-container-low px-2 py-1.5 text-xs font-medium text-on-surface outline-none ring-1 ring-transparent focus:ring-primary"
                  />
                  <span className="text-xs text-on-surface-variant">—</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    aria-label="საბოლოო თარიღი"
                    className="rounded-lg bg-surface-container-low px-2 py-1.5 text-xs font-medium text-on-surface outline-none ring-1 ring-transparent focus:ring-primary"
                  />
                </div>
              )}
              <button
                onClick={handleSync}
                disabled={syncing}
                aria-label="მონაცემების სინქრონიზაცია"
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-bold text-white shadow-md shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-50"
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">სინქრონიზაცია</span>
                <span className="sm:hidden">სინქ.</span>
              </button>
            </div>
          </header>

          <div className="-mt-4 flex items-center gap-3">
            {adAccount.last_synced_at && (
              <p
                className="text-xs text-on-surface-variant"
                title={format(
                  new Date(adAccount.last_synced_at),
                  "dd/MM/yyyy HH:mm",
                )}
              >
                ბოლო სინქრონიზაცია:{" "}
                {formatDistanceToNow(new Date(adAccount.last_synced_at), {
                  addSuffix: true,
                  locale: ka,
                })}
              </p>
            )}
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="text-xs text-on-surface-variant/60 underline transition-colors hover:text-[#ba1a1a] disabled:opacity-50"
            >
              {disconnecting ? "გათიშვა..." : "ანგარიშის გათიშვა"}
            </button>
          </div>

          {refetching && (
            <div className="h-1 overflow-hidden rounded-full bg-surface-container-low">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
            </div>
          )}

          {/* AI Recommendations Banner */}
          <AIBanner
            topRecommendation={
              recommendations.find((r) => r.priority === "high") ??
              recommendations[0] ??
              null
            }
            onViewAll={() => {
              document
                .getElementById("recommendations-section")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          />

          {/* Stats Row */}
          <StatsRow stats={computeStats()} />

          {/* Main Content Columns */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left Column (7/12) */}
            <div className="space-y-8 lg:col-span-7">
              <CampaignTable campaigns={buildCampaignRows()} />
              <PerformanceChart data={computePerformanceData()} />
              <SxartiInsights
                chartData={computeCorrelationData()}
                insights={computeInsights()}
              />
            </div>

            {/* Right Column (5/12) */}
            <div className="space-y-8 lg:col-span-5">
              <div id="recommendations-section">
                <RecommendationsList
                  recommendations={recommendations}
                  onDiscussInChat={(context) => {
                    const params = context
                      ? `?prefill=${encodeURIComponent(
                          `გთხოვ გაანალიზე ჩემი რეკლამების რეკომენდაციები:\n${context}`,
                        )}`
                      : "";
                    router.push(`/dashboard/ai-chat${params}`);
                  }}
                />
              </div>
              <TopCreatives
                creatives={topAds.map((a) => {
                  // Get campaign_id from the joined ad_sets relation
                  const adSetData = (a as unknown as Record<string, unknown>)
                    .ad_sets as { campaign_id: string } | undefined;
                  const campaignId = adSetData?.campaign_id;
                  const cMetrics = campaignId
                    ? metrics.filter((m) => m.campaign_id === campaignId)
                    : metrics;
                  const avgCtr =
                    cMetrics.length > 0
                      ? cMetrics.reduce((s, m) => s + (m.ctr || 0), 0) /
                        cMetrics.length
                      : 0;
                  return {
                    name: a.name ?? "Ad",
                    thumbnailUrl: a.creative_thumbnail_url,
                    ctr: avgCtr,
                  };
                })}
              />
              <AudienceBreakdown {...computeAudienceData()} />
            </div>
          </div>

          {/* Footer Action Bar */}
          <FooterActionBar onExport={handleExport} />
        </div>
      )}
    </>
  );

  return (
    <PremiumGate subscriptionPlan={tenant.subscription_plan}>
      {dashboardContent}
    </PremiumGate>
  );
}
