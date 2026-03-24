import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MessageSquare, ShoppingCart, DollarSign, Clock } from "lucide-react";
import { formatGEL } from "@/lib/utils/currency";
import {
  georgianTodayStartUTC,
  toGeorgianDateKey,
} from "@/lib/utils/georgian-time";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { AttentionConversations } from "@/components/dashboard/attention-conversations";
import { RevenueChartWrapper } from "./revenue-chart-wrapper";
import type { Order, Conversation } from "@/types/database";

export default async function OverviewPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get tenant
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!tenant) redirect("/step-1");

  const tenantId = tenant.id;
  const todayISO = georgianTodayStartUTC();

  // Parallel data fetching
  const [
    conversationsRes,
    ordersRes,
    avgResponseRes,
    trendRes,
    recentOrdersRes,
    handoffRes,
  ] = await Promise.all([
    // Today's conversations
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("started_at", todayISO),

    // Today's orders
    supabase
      .from("orders")
      .select("total")
      .eq("tenant_id", tenantId)
      .gte("created_at", todayISO),

    // Avg response time (last 24h): bot messages that followed a customer message
    supabase
      .from("messages")
      .select("created_at, sender")
      .eq("tenant_id", tenantId)
      .gte("created_at", new Date(Date.now() - 86400000).toISOString())
      .order("created_at", { ascending: true })
      .limit(500),

    // 7-day trend
    supabase
      .from("conversations")
      .select("started_at")
      .eq("tenant_id", tenantId)
      .gte("started_at", new Date(Date.now() - 7 * 86400000).toISOString()),

    // Last 5 orders
    supabase
      .from("orders")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(5),

    // Handoff conversations
    supabase
      .from("conversations")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("status", "handoff")
      .order("handed_off_at", { ascending: false })
      .limit(10),
  ]);

  // Compute stats
  const todayConversations = conversationsRes.count ?? 0;

  const todayOrders = ordersRes.data ?? [];
  const todayOrderCount = todayOrders.length;
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);

  // Calculate avg response time
  let avgResponseSec = 0;
  if (avgResponseRes.data && avgResponseRes.data.length > 1) {
    const messages = avgResponseRes.data;
    const responseTimes: number[] = [];
    for (let i = 1; i < messages.length; i++) {
      if (
        messages[i].sender === "bot" &&
        messages[i - 1].sender === "customer"
      ) {
        const diff =
          new Date(messages[i].created_at).getTime() -
          new Date(messages[i - 1].created_at).getTime();
        responseTimes.push(diff / 1000);
      }
    }
    if (responseTimes.length > 0) {
      avgResponseSec =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }
  }

  const formatResponseTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)} წმ`;
    return `${Math.round(seconds / 60)} წთ`;
  };

  // Build 7-day trend data
  const trendData: {
    date: string;
    conversations: number;
    orders: number;
    revenue: number;
  }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = toGeorgianDateKey(d);
    trendData.push({ date: dateStr, conversations: 0, orders: 0, revenue: 0 });
  }

  // Count conversations per day
  if (trendRes.data) {
    for (const conv of trendRes.data) {
      const dateStr = toGeorgianDateKey(conv.started_at);
      const bucket = trendData.find((d) => d.date === dateStr);
      if (bucket) bucket.conversations++;
    }
  }

  // Also fetch orders for trend
  const { data: trendOrders } = await supabase
    .from("orders")
    .select("created_at, total")
    .eq("tenant_id", tenantId)
    .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());

  if (trendOrders) {
    for (const order of trendOrders) {
      const dateStr = toGeorgianDateKey(order.created_at);
      const bucket = trendData.find((d) => d.date === dateStr);
      if (bucket) {
        bucket.orders++;
        bucket.revenue += order.total ?? 0;
      }
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-on-surface">მიმოხილვა</h1>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="დღის საუბრები"
          value={String(todayConversations)}
          icon={MessageSquare}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
        <StatCard
          title="დღის შეკვეთები"
          value={String(todayOrderCount)}
          icon={ShoppingCart}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatCard
          title="დღის შემოსავალი"
          value={formatGEL(todayRevenue)}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
        <StatCard
          title="საშ. პასუხის დრო"
          value={formatResponseTime(avgResponseSec)}
          icon={Clock}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
        />
      </div>

      {/* Revenue Chart */}
      <RevenueChartWrapper data={trendData} />

      {/* Bottom section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentOrders orders={(recentOrdersRes.data ?? []) as Order[]} />
        <AttentionConversations
          conversations={(handoffRes.data ?? []) as Conversation[]}
        />
      </div>
    </div>
  );
}
