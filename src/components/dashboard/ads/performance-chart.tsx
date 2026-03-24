"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";

interface PerformanceChartProps {
  data: {
    date: string;
    spend: number;
    clicks: number;
    conversions: number;
    ctr: number;
  }[];
}

const metrics = [
  { key: "spend", label: "დახარჯული", color: "#3525cd" },
  { key: "clicks", label: "დაწკაპუნებები", color: "#7531e6" },
  { key: "conversions", label: "კონვერსიები", color: "#006c49" },
  { key: "ctr", label: "CTR", color: "#5c00ca" },
] as const;

type MetricKey = (typeof metrics)[number]["key"];

export function PerformanceChart({ data }: PerformanceChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("spend");

  if (data.length === 0) {
    return (
      <section className="flex h-80 flex-col items-center justify-center rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-sm text-on-surface-variant">
          მონაცემები ჯერ არ არის. სინქრონიზაციის შემდეგ გრაფიკი გამოჩნდება.
        </p>
      </section>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
  };

  const activeColor =
    metrics.find((m) => m.key === activeMetric)?.color ?? "#3525cd";

  return (
    <section className="flex h-80 flex-col rounded-2xl bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h4 className="text-xl font-bold text-on-surface">დინამიკა დროში</h4>
        <div className="flex gap-2">
          {metrics.map((m) => (
            <button
              key={m.key}
              onClick={() => setActiveMetric(m.key)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold transition-colors",
                activeMetric === m.key
                  ? "bg-surface-container-high text-primary"
                  : "bg-surface-container-low text-on-surface-variant hover:text-primary",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#eff4ff"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 10, fontWeight: 700, fill: "#464555" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#464555" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
                fontSize: "12px",
                fontWeight: 600,
              }}
              cursor={{ fill: "rgba(53,37,205,0.05)" }}
              formatter={(value: number) =>
                activeMetric === "ctr"
                  ? [`${value}%`, "CTR"]
                  : activeMetric === "spend"
                    ? [`${value.toFixed(0)} ₾`, "დახარჯული"]
                    : [
                        value,
                        metrics.find((m) => m.key === activeMetric)?.label,
                      ]
              }
            />
            <Bar
              dataKey={activeMetric}
              fill="#eff4ff"
              radius={[6, 6, 0, 0]}
              activeBar={{ fill: activeColor }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
