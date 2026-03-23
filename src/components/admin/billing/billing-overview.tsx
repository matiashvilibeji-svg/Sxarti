"use client";

import {
  Banknote,
  BarChart3,
  Users,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BillingMetrics {
  mrr: number;
  mrrGrowth: number;
  annualRunRate: number;
  activePaidUsers: number;
  activePaidUsersChange: number;
  trialConversionRate: number;
  trialConversionChange: number;
  churnRate: number;
  churnRateChange: number;
  arpu: number;
  arpuChange: number;
}

interface BillingOverviewProps {
  metrics: BillingMetrics;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("ka-GE").format(value) + "₾";
};

interface KpiCardProps {
  label: string;
  value: string;
  trend?: { value: number; label: string };
  icon: React.ReactNode;
  iconBg: string;
}

function KpiCard({ label, value, trend, icon, iconBg }: KpiCardProps) {
  const isPositive = trend && trend.value >= 0;

  return (
    <Card className="p-6 space-y-4 bg-surface-container-lowest shadow-sm">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">
          {label}
        </span>
        <div className={cn("p-2 rounded-lg", iconBg)}>{icon}</div>
      </div>
      <div className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tighter font-mono text-on-surface">
          {value}
        </h2>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-[11px] font-bold",
              isPositive ? "text-primary" : "text-destructive",
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span>
              {isPositive ? "+" : ""}
              {trend.value.toFixed(1)}% {trend.label}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

export function BillingOverview({ metrics }: BillingOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KpiCard
        label="Monthly Recurring Revenue"
        value={formatCurrency(metrics.mrr)}
        trend={{ value: metrics.mrrGrowth, label: "vs last month" }}
        icon={<Banknote className="h-4 w-4 text-primary" />}
        iconBg="bg-primary/10"
      />
      <KpiCard
        label="Annual Run Rate"
        value={formatCurrency(metrics.annualRunRate)}
        trend={{ value: metrics.mrrGrowth, label: "projected" }}
        icon={<BarChart3 className="h-4 w-4 text-secondary" />}
        iconBg="bg-secondary/10"
      />
      <KpiCard
        label="Active Paid Users"
        value={metrics.activePaidUsers.toString()}
        trend={{
          value: metrics.activePaidUsersChange,
          label: "from last month",
        }}
        icon={<Users className="h-4 w-4 text-on-surface-variant" />}
        iconBg="bg-surface-container-high"
      />
      <KpiCard
        label="Trial → Paid Conv."
        value={metrics.trialConversionRate.toFixed(1) + "%"}
        trend={{
          value: metrics.trialConversionChange,
          label: "improvement",
        }}
        icon={<ArrowLeftRight className="h-4 w-4 text-orange-600" />}
        iconBg="bg-orange-50"
      />
    </div>
  );
}
