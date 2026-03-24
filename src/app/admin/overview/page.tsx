import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminDashboardStats, AuditLogEntry } from "@/types/admin";
import { georgianMonthStartUTC } from "@/lib/utils/georgian-time";

export const dynamic = "force-dynamic";
import { StatsGrid } from "@/components/admin/overview/stats-grid";
import { RevenueTrendChart } from "@/components/admin/overview/revenue-trend-chart";
import { SignupChart } from "@/components/admin/overview/signup-chart";
import { SubscriptionDistribution } from "@/components/admin/overview/subscription-distribution";
import { RecentActivity } from "@/components/admin/overview/recent-activity";
import { TopBusinesses } from "@/components/admin/overview/top-businesses";

const PLAN_PRICES = { starter: 49, business: 149, premium: 299 } as const;

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

async function getDashboardData() {
  const supabase = createAdminClient();
  const now = new Date();
  const startOfMonth = georgianMonthStartUTC();

  // Parallel queries
  const [tenantsResult, ticketsResult, healthResult, auditResult] =
    await Promise.all([
      supabase
        .from("tenants")
        .select(
          "id, business_name, subscription_plan, subscription_status, conversations_this_month, created_at",
        ),
      supabase
        .from("support_tickets")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"]),
      supabase
        .from("system_health_checks")
        .select("status")
        .order("checked_at", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("audit_log")
        .select(
          "id, admin_id, action, resource_type, resource_id, details, ip_address, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const tenants = tenantsResult.data ?? [];
  const openTickets = ticketsResult.count ?? 0;
  const systemStatus =
    (healthResult.data?.status as AdminDashboardStats["system_status"]) ??
    "healthy";
  const auditEntries = (auditResult.data ?? []) as AuditLogEntry[];

  // Compute stats
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(
    (t) => t.subscription_status === "active",
  ).length;
  const newThisMonth = tenants.filter(
    (t) => t.created_at >= startOfMonth,
  ).length;

  const subs = { starter: 0, business: 0, premium: 0 };
  let monthlyRevenue = 0;
  let conversationsThisMonth = 0;

  for (const t of tenants) {
    if (t.subscription_status === "active") {
      const plan = t.subscription_plan as keyof typeof PLAN_PRICES;
      subs[plan] = (subs[plan] ?? 0) + 1;
      monthlyRevenue += PLAN_PRICES[plan] ?? 0;
    }
    conversationsThisMonth += t.conversations_this_month ?? 0;
  }

  const stats: AdminDashboardStats = {
    total_tenants: totalTenants,
    active_tenants: activeTenants,
    new_tenants_this_month: newThisMonth,
    total_revenue: monthlyRevenue,
    monthly_revenue: monthlyRevenue,
    total_conversations: conversationsThisMonth,
    conversations_this_month: conversationsThisMonth,
    active_subscriptions: subs,
    open_tickets: openTickets,
    system_status: systemStatus,
  };

  // Revenue trend: last 6 months (approximate using current plan distribution)
  const revenueTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(
      d.getFullYear(),
      d.getMonth() + 1,
      0,
    ).toISOString();
    const tenantsAtMonth = tenants.filter((t) => t.created_at <= monthEnd);
    let rev = 0;
    for (const t of tenantsAtMonth) {
      if (t.subscription_status === "active") {
        rev +=
          PLAN_PRICES[t.subscription_plan as keyof typeof PLAN_PRICES] ?? 0;
      }
    }
    revenueTrend.push({
      month: MONTH_NAMES[d.getMonth()],
      revenue: rev,
    });
  }

  // Signups by week (last 8 weeks)
  const signupData = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - i * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const count = tenants.filter((t) => {
      const created = new Date(t.created_at);
      return created >= weekStart && created < weekEnd;
    }).length;
    signupData.push({
      week: `W${8 - i}`,
      count,
    });
  }

  // Top 5 businesses by conversations
  const topBusinesses = [...tenants]
    .sort(
      (a, b) =>
        (b.conversations_this_month ?? 0) - (a.conversations_this_month ?? 0),
    )
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      business_name: t.business_name,
      subscription_plan: t.subscription_plan as
        | "starter"
        | "business"
        | "premium",
      conversations_this_month: t.conversations_this_month ?? 0,
      subscription_status: t.subscription_status,
    }));

  return {
    stats,
    revenueTrend,
    signupData,
    auditEntries,
    topBusinesses,
  };
}

export default async function AdminOverviewPage() {
  const { stats, revenueTrend, signupData, auditEntries, topBusinesses } =
    await getDashboardData();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">
          Dashboard Overview
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Real-time system health and commercial performance metrics.
        </p>
      </div>

      {/* KPI Stats */}
      <StatsGrid stats={stats} />

      {/* Revenue Trend — full width */}
      <RevenueTrendChart data={revenueTrend} />

      {/* Three-column grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <SubscriptionDistribution
          starter={stats.active_subscriptions.starter}
          business={stats.active_subscriptions.business}
          premium={stats.active_subscriptions.premium}
        />
        <SignupChart data={signupData} />
        <RecentActivity entries={auditEntries} />
      </div>

      {/* Top Businesses — full width */}
      <TopBusinesses businesses={topBusinesses} />
    </div>
  );
}
