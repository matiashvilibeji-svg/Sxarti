"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ka } from "date-fns/locale";

interface ConversationsChartData {
  date: string;
  count: number;
}

interface ConversationsChartProps {
  data: ConversationsChartData[];
  period: string;
}

export function ConversationsChart({ data, period }: ConversationsChartProps) {
  const formatLabel = (date: string) => {
    const d = new Date(date);
    if (period === "7d") return format(d, "EEE", { locale: ka });
    return format(d, "d MMM", { locale: ka });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">საუბრები</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-16 text-center text-sm text-on-surface-variant">
            მონაცემები ჯერ არ არის
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-surface-container-high"
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatLabel}
                className="text-xs"
                tick={{ fill: "var(--on-surface-variant)" }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "var(--on-surface-variant)" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface-container-lowest)",
                  border: "1px solid var(--surface-container-high)",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [value, "საუბრები"]}
                labelFormatter={formatLabel}
              />
              <Bar
                dataKey="count"
                fill="#a855f7"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
