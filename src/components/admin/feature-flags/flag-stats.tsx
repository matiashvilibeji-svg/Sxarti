"use client";

import { Flag, ToggleRight, ToggleLeft, Clock } from "lucide-react";
import { differenceInDays } from "date-fns";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import type { FeatureFlag } from "@/types/admin";

interface FlagStatsProps {
  flags: FeatureFlag[];
}

export function FlagStats({ flags }: FlagStatsProps) {
  const enabled = flags.filter((f) => f.is_enabled).length;
  const disabled = flags.length - enabled;
  const recentlyChanged = flags.filter(
    (f) => differenceInDays(new Date(), new Date(f.updated_at)) <= 7,
  ).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <AdminStatCard
        title="Total Flags"
        value={String(flags.length)}
        icon={Flag}
        iconColor="text-primary"
        iconBg="bg-primary/10"
      />
      <AdminStatCard
        title="Enabled"
        value={String(enabled)}
        icon={ToggleRight}
        iconColor="text-green-600"
        iconBg="bg-green-50"
      />
      <AdminStatCard
        title="Disabled"
        value={String(disabled)}
        icon={ToggleLeft}
        iconColor="text-slate-500"
        iconBg="bg-slate-100"
      />
      <AdminStatCard
        title="Recently Changed"
        value={String(recentlyChanged)}
        subtitle="Last 7 days"
        icon={Clock}
        iconColor="text-amber-600"
        iconBg="bg-amber-50"
      />
    </div>
  );
}
