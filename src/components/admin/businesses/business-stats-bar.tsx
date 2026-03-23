"use client";

import { Building2, CreditCard, Clock, AlertTriangle } from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";

interface BusinessStats {
  total: number;
  starter: number;
  business: number;
  premium: number;
  activeTrials: number;
  expiringThisWeek: number;
}

export function BusinessStatsBar({ stats }: { stats: BusinessStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <AdminStatCard
        title="Total Businesses"
        value={String(stats.total)}
        icon={Building2}
      />
      <AdminStatCard
        title="By Plan"
        value={`${stats.starter} / ${stats.business} / ${stats.premium}`}
        icon={CreditCard}
        subtitle="Starter / Business / Premium"
      />
      <AdminStatCard
        title="Active Trials"
        value={String(stats.activeTrials)}
        icon={Clock}
        iconColor="text-amber-600"
        iconBg="bg-amber-500/10"
      />
      <AdminStatCard
        title="Expiring This Week"
        value={String(stats.expiringThisWeek)}
        icon={AlertTriangle}
        iconColor="text-red-500"
        iconBg="bg-red-500/10"
      />
    </div>
  );
}
