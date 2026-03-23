"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";

export interface MonthlyRevenue {
  month: string;
  starter: number;
  business: number;
  premium: number;
}

interface RevenueChartProps {
  data: MonthlyRevenue[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;

  const total = payload.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="bg-surface-container-lowest p-3 rounded-lg shadow-ambient border border-surface-container-high">
      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
        {label}
      </p>
      {payload.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center justify-between gap-4 text-xs"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-on-surface-variant capitalize">
              {entry.name}
            </span>
          </div>
          <span className="font-mono font-medium text-on-surface">
            {new Intl.NumberFormat("ka-GE").format(entry.value)}₾
          </span>
        </div>
      ))}
      <div className="mt-2 pt-2 border-t border-surface-container-high flex justify-between text-xs">
        <span className="font-bold text-on-surface-variant">Total</span>
        <span className="font-mono font-bold text-on-surface">
          {new Intl.NumberFormat("ka-GE").format(total)}₾
        </span>
      </div>
    </div>
  );
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card className="p-8 bg-surface-container-lowest shadow-sm">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-lg font-bold text-on-surface">
            Revenue Breakdown
          </h3>
          <p className="text-xs text-on-surface-variant">
            Tiered distribution over last 6 months
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-sm" />
            <span className="text-[10px] font-bold text-on-surface-variant uppercase">
              Premium
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-secondary rounded-sm" />
            <span className="text-[10px] font-bold text-on-surface-variant uppercase">
              Business
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-outline-variant rounded-sm" />
            <span className="text-[10px] font-bold text-on-surface-variant uppercase">
              Starter
            </span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barGap={2}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--color-surface-container-high, #e6e8ea)"
          />
          <XAxis
            dataKey="month"
            tick={{
              fontSize: 10,
              fill: "var(--color-on-surface-variant, #3c4947)",
            }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{
              fontSize: 10,
              fill: "var(--color-on-surface-variant, #3c4947)",
            }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
          />
          <Bar
            dataKey="premium"
            stackId="revenue"
            fill="var(--color-primary, #006b5f)"
            radius={[0, 0, 4, 4]}
          />
          <Bar
            dataKey="business"
            stackId="revenue"
            fill="var(--color-secondary, #0058be)"
          />
          <Bar
            dataKey="starter"
            stackId="revenue"
            fill="var(--color-outline-variant, #bbcac6)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
