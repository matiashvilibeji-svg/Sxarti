"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatGEL } from "@/lib/utils/currency";

interface RevenueChartData {
  date: string;
  conversations: number;
  orders: number;
  revenue: number;
}

interface RevenueChartProps {
  data: RevenueChartData[];
}

const dayLabels: Record<string, string> = {
  Mon: "ორშ",
  Tue: "სამ",
  Wed: "ოთხ",
  Thu: "ხუთ",
  Fri: "პარ",
  Sat: "შაბ",
  Sun: "კვ",
};

function formatDayLabel(date: string): string {
  const d = new Date(date);
  const eng = d.toLocaleDateString("en-US", { weekday: "short" });
  return dayLabels[eng] ?? eng;
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">7 დღის ტრენდი</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-16 text-center text-sm text-on-surface-variant">
            მონაცემები ჯერ არ არის
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="colorConversations"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-surface-container-high"
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDayLabel}
                className="text-xs"
                tick={{ fill: "var(--on-surface-variant)" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "var(--on-surface-variant)" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface-container-lowest)",
                  border: "1px solid var(--surface-container-high)",
                  borderRadius: "8px",
                }}
                formatter={(value: number, name: string) => {
                  if (name === "revenue")
                    return [formatGEL(value), "შემოსავალი"];
                  if (name === "conversations") return [value, "საუბრები"];
                  return [value, "შეკვეთები"];
                }}
                labelFormatter={formatDayLabel}
              />
              <Legend
                formatter={(value: string) => {
                  if (value === "conversations") return "საუბრები";
                  if (value === "orders") return "შეკვეთები";
                  return "შემოსავალი";
                }}
              />
              <Area
                type="monotone"
                dataKey="conversations"
                stroke="#a855f7"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorConversations)"
              />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorOrders)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
