"use client";

import { useState, useEffect, useCallback } from "react";
import { useTenant } from "@/hooks/use-tenant";
import { useSupabase } from "@/hooks/use-supabase";
import dynamic from "next/dynamic";
import { TimePeriodSelector, StatCard } from "@/components/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import type { OrderItem } from "@/types/database";
import { toGeorgianDateKey } from "@/lib/utils/georgian-time";

const ConversationsChart = dynamic(
  () =>
    import("@/components/dashboard/conversations-chart").then(
      (m) => m.ConversationsChart,
    ),
  { ssr: false, loading: () => <Skeleton className="h-80" /> },
);
const RevenueChart = dynamic(
  () =>
    import("@/components/dashboard/revenue-chart").then((m) => m.RevenueChart),
  { ssr: false, loading: () => <Skeleton className="h-80" /> },
);
const ConversionFunnel = dynamic(
  () =>
    import("@/components/dashboard/conversion-funnel").then(
      (m) => m.ConversionFunnel,
    ),
  { ssr: false, loading: () => <Skeleton className="h-64" /> },
);
const TopProducts = dynamic(
  () =>
    import("@/components/dashboard/top-products").then((m) => m.TopProducts),
  { ssr: false, loading: () => <Skeleton className="h-64" /> },
);
const PeakHoursHeatmap = dynamic(
  () =>
    import("@/components/dashboard/peak-hours-heatmap").then(
      (m) => m.PeakHoursHeatmap,
    ),
  { ssr: false, loading: () => <Skeleton className="h-64" /> },
);

interface DailyBucket {
  date: string;
  count: number;
}

interface TrendBucket {
  date: string;
  conversations: number;
  orders: number;
  revenue: number;
}

interface FunnelData {
  conversations: number;
  carts: number;
  orders: number;
  confirmed: number;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

interface HeatmapCell {
  hour: number;
  day: number;
  count: number;
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("7d");
  const { tenant, loading: tenantLoading } = useTenant();
  const supabase = useSupabase();

  const [conversationsData, setConversationsData] = useState<DailyBucket[]>([]);
  const [revenueData, setRevenueData] = useState<TrendBucket[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelData>({
    conversations: 0,
    carts: 0,
    orders: 0,
    confirmed: 0,
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([]);
  const [handoffRate, setHandoffRate] = useState(0);
  const [loading, setLoading] = useState(true);

  const getDaysFromPeriod = (p: string) => {
    if (p === "30d") return 30;
    if (p === "90d") return 90;
    return 7;
  };

  const fetchData = useCallback(async () => {
    if (!tenant) return;
    setLoading(true);

    const days = getDaysFromPeriod(period);
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const tenantId = tenant.id;

    const [convRes, ordersRes, messagesRes, handoffRes, totalConvRes] =
      await Promise.all([
        // All conversations in period
        supabase
          .from("conversations")
          .select("id, started_at, cart, status")
          .eq("tenant_id", tenantId)
          .gte("started_at", since),

        // All orders in period
        supabase
          .from("orders")
          .select("created_at, total, items, payment_status")
          .eq("tenant_id", tenantId)
          .gte("created_at", since),

        // Messages for heatmap
        supabase
          .from("messages")
          .select("created_at")
          .eq("tenant_id", tenantId)
          .eq("sender", "customer")
          .gte("created_at", since),

        // Handoff count
        supabase
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("status", "handoff")
          .gte("started_at", since),

        // Total conversations for handoff rate
        supabase
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .gte("started_at", since),
      ]);

    const conversations = convRes.data ?? [];
    const orders = ordersRes.data ?? [];
    const messages = messagesRes.data ?? [];

    // Build daily conversation buckets
    const convBuckets: Record<string, number> = {};
    const revBuckets: Record<string, TrendBucket> = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = toGeorgianDateKey(d);
      convBuckets[key] = 0;
      revBuckets[key] = { date: key, conversations: 0, orders: 0, revenue: 0 };
    }

    for (const c of conversations) {
      const key = toGeorgianDateKey(c.started_at);
      if (convBuckets[key] !== undefined) convBuckets[key]++;
      if (revBuckets[key]) revBuckets[key].conversations++;
    }

    for (const o of orders) {
      const key = toGeorgianDateKey(o.created_at);
      if (revBuckets[key]) {
        revBuckets[key].orders++;
        revBuckets[key].revenue += o.total ?? 0;
      }
    }

    setConversationsData(
      Object.entries(convBuckets).map(([date, count]) => ({ date, count })),
    );
    setRevenueData(Object.values(revBuckets));

    // Funnel
    const cartsCount = conversations.filter(
      (c) => Array.isArray(c.cart) && c.cart.length > 0,
    ).length;
    const ordersCount = orders.length;
    const confirmedCount = orders.filter(
      (o) => o.payment_status === "confirmed",
    ).length;

    setFunnelData({
      conversations: conversations.length,
      carts: cartsCount,
      orders: ordersCount,
      confirmed: confirmedCount,
    });

    // Top products from order items
    const productMap: Record<string, { sales: number; revenue: number }> = {};
    for (const o of orders) {
      const items = (o.items ?? []) as OrderItem[];
      for (const item of items) {
        const name = item.name;
        if (!productMap[name]) productMap[name] = { sales: 0, revenue: 0 };
        productMap[name].sales += item.quantity;
        productMap[name].revenue += item.unit_price * item.quantity;
      }
    }
    const sortedProducts = Object.entries(productMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
    setTopProducts(sortedProducts);

    // Heatmap from messages
    const heatmap: Record<string, number> = {};
    for (const m of messages) {
      const d = new Date(m.created_at);
      const day = (d.getDay() + 6) % 7; // Monday = 0
      const hour = d.getHours();
      const key = `${day}-${hour}`;
      heatmap[key] = (heatmap[key] ?? 0) + 1;
    }
    setHeatmapData(
      Object.entries(heatmap).map(([key, count]) => {
        const [day, hour] = key.split("-").map(Number);
        return { day, hour, count };
      }),
    );

    // Handoff rate
    const totalConv = totalConvRes.count ?? 0;
    const handoffs = handoffRes.count ?? 0;
    setHandoffRate(totalConv > 0 ? (handoffs / totalConv) * 100 : 0);

    setLoading(false);
  }, [tenant, period, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (tenantLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-on-surface">ანალიტიკა</h1>
        <TimePeriodSelector value={period} onChange={setPeriod} />
      </div>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <>
          {/* Charts row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ConversationsChart data={conversationsData} period={period} />
            <RevenueChart data={revenueData} />
          </div>

          {/* Funnel + Handoff rate */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ConversionFunnel data={funnelData} />
            </div>
            <StatCard
              title="ოპერატორზე გადაცემის %"
              value={`${handoffRate.toFixed(1)}%`}
              icon={Users}
              iconColor="text-amber-600"
              iconBg="bg-amber-100"
            />
          </div>

          {/* Products + Heatmap */}
          <div className="grid gap-6 lg:grid-cols-2">
            <TopProducts products={topProducts} />
            <PeakHoursHeatmap data={heatmapData} />
          </div>
        </>
      )}
    </div>
  );
}
