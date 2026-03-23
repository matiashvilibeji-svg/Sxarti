import {
  Building2,
  CreditCard,
  Banknote,
  MessageSquare,
  TicketCheck,
  Activity,
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import type { AdminDashboardStats } from "@/types/admin";

interface StatsGridProps {
  stats: AdminDashboardStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  const activationRate =
    stats.total_tenants > 0
      ? ((stats.active_tenants / stats.total_tenants) * 100).toFixed(1)
      : "0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
      <AdminStatCard
        title="Total Businesses"
        value={stats.total_tenants.toLocaleString()}
        icon={Building2}
        subtitle={`+${stats.new_tenants_this_month} this month`}
      />
      <AdminStatCard
        title="Active Subs"
        value={stats.active_tenants.toLocaleString()}
        icon={CreditCard}
        subtitle={`${activationRate}% activation`}
        iconColor="text-secondary"
        iconBg="bg-secondary/10"
      />
      <AdminStatCard
        title="Monthly Revenue"
        value={`${stats.monthly_revenue.toLocaleString()}₾`}
        icon={Banknote}
        iconColor="text-green-600"
        iconBg="bg-green-600/10"
      />
      <AdminStatCard
        title="Conversations"
        value={stats.conversations_this_month.toLocaleString()}
        icon={MessageSquare}
        subtitle="This month"
        iconColor="text-tertiary"
        iconBg="bg-tertiary/10"
      />
      <AdminStatCard
        title="Open Tickets"
        value={stats.open_tickets.toLocaleString()}
        icon={TicketCheck}
        iconColor="text-orange-600"
        iconBg="bg-orange-100"
      />
      <AdminStatCard
        title="System Health"
        value={
          stats.system_status === "healthy"
            ? "Healthy"
            : stats.system_status === "degraded"
              ? "Degraded"
              : "Down"
        }
        icon={Activity}
        iconColor={
          stats.system_status === "healthy"
            ? "text-green-600"
            : stats.system_status === "degraded"
              ? "text-orange-600"
              : "text-red-600"
        }
        iconBg={
          stats.system_status === "healthy"
            ? "bg-green-100"
            : stats.system_status === "degraded"
              ? "bg-orange-100"
              : "bg-red-100"
        }
      />
    </div>
  );
}
