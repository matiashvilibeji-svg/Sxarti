"use client";

import { useRouter } from "next/navigation";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BillingOverview } from "@/components/admin/billing/billing-overview";
import {
  RevenueChart,
  type MonthlyRevenue,
} from "@/components/admin/billing/revenue-chart";
import { PlanDistributionChart } from "@/components/admin/billing/plan-distribution-chart";
import { TrialManagement } from "@/components/admin/billing/trial-management";
import {
  SubscriberTable,
  type SubscriberRow,
} from "@/components/admin/billing/subscriber-table";

interface BillingPageClientProps {
  metrics: {
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
  };
  distribution: { starter: number; business: number; premium: number };
  growth: { starter: number; business: number; premium: number };
  churnReasons: {
    pricing: number;
    features: number;
    complexity: number;
    other: number;
  };
  revenueHistory: MonthlyRevenue[];
  trials: {
    id: string;
    business_name: string;
    trial_ends_at: string;
    created_at: string;
  }[];
  subscribers: SubscriberRow[];
}

export function BillingPageClient({
  metrics,
  distribution,
  growth,
  churnReasons,
  revenueHistory,
  trials,
  subscribers,
}: BillingPageClientProps) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="p-8 max-w-[1440px] mx-auto space-y-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface uppercase">
            Subscriptions &amp; Billing
          </h1>
          <p className="text-sm text-on-surface-variant">
            Comprehensive financial oversight and revenue tracking.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Custom Plan
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <BillingOverview metrics={metrics} />

      {/* Revenue Breakdown + Churn Reasons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <RevenueChart data={revenueHistory} />
        </div>
        <div className="lg:col-span-4">
          <PlanDistributionChart
            distribution={distribution}
            growth={growth}
            churnReasons={churnReasons}
            churnAlert="Alert: Monthly churn increased by 0.4% this cycle."
          />
        </div>
      </div>

      {/* Trial Management */}
      {trials.length > 0 && (
        <TrialManagement trials={trials} onTrialExtended={handleRefresh} />
      )}

      {/* Subscriber Table */}
      <SubscriberTable subscribers={subscribers} onRefresh={handleRefresh} />
    </div>
  );
}
