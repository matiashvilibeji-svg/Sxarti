"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanDistribution {
  starter: number;
  business: number;
  premium: number;
}

interface PlanGrowth {
  starter: number;
  business: number;
  premium: number;
}

interface ChurnReasons {
  pricing: number;
  features: number;
  complexity: number;
  other: number;
}

interface PlanDistributionChartProps {
  distribution: PlanDistribution;
  growth: PlanGrowth;
  churnReasons: ChurnReasons;
  churnAlert?: string;
}

const PLAN_PRICES = { starter: 49, business: 149, premium: 299 };

const PLAN_COLORS = [
  "var(--color-primary, #006b5f)",
  "var(--color-secondary, #0058be)",
  "var(--color-outline-variant, #bbcac6)",
];

const PLAN_LABELS = [
  { key: "premium" as const, label: "Premium", color: "bg-primary" },
  { key: "business" as const, label: "Business", color: "bg-secondary" },
  { key: "starter" as const, label: "Starter", color: "bg-outline-variant" },
];

function ChurnBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function PlanDistributionChart({
  distribution,
  growth,
  churnReasons,
  churnAlert,
}: PlanDistributionChartProps) {
  const chartData = [
    { name: "Premium", value: distribution.premium },
    { name: "Business", value: distribution.business },
    { name: "Starter", value: distribution.starter },
  ];

  const total =
    distribution.starter + distribution.business + distribution.premium;

  return (
    <Card className="p-6 bg-surface-container-lowest shadow-sm h-full flex flex-col">
      <h3 className="text-sm font-bold text-on-surface mb-6">Churn Reasons</h3>
      <div className="flex-1 space-y-6">
        <ChurnBar label="Pricing" value={churnReasons.pricing} />
        <ChurnBar label="Lack of Features" value={churnReasons.features} />
        <ChurnBar label="UI/UX Complexity" value={churnReasons.complexity} />
        <ChurnBar label="Other" value={churnReasons.other} />
      </div>
      {churnAlert && (
        <div className="mt-8 p-4 bg-destructive/10 rounded-lg flex items-center gap-3">
          <span className="text-destructive text-lg">⚠</span>
          <div className="text-[11px] font-medium text-destructive">
            {churnAlert}
          </div>
        </div>
      )}
    </Card>
  );
}
