"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface AdsConversationsChartProps {
  data: {
    date: string;
    spend: number;
    conversations: number;
  }[];
}

export function AdsConversationsChart({ data }: AdsConversationsChartProps) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={data}>
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
          yAxisId="left"
          tick={{ fontSize: 10, fill: "#464555" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 10, fill: "#464555" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "none",
            boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
            fontSize: "12px",
            fontWeight: 600,
          }}
          formatter={(value: number, name: string) =>
            name === "დახარჯული (₾)"
              ? [`${value.toFixed(0)} ₾`, name]
              : [value, name]
          }
          labelFormatter={formatDate}
        />
        <Legend
          wrapperStyle={{ fontSize: "10px", fontWeight: 700 }}
          iconType="square"
        />
        <Bar
          yAxisId="left"
          dataKey="spend"
          name="დახარჯული (₾)"
          fill="#eff4ff"
          activeBar={{ fill: "#4f46e5" }}
          radius={[4, 4, 0, 0]}
        />
        <Line
          yAxisId="right"
          dataKey="conversations"
          name="საუბრები"
          stroke="#006c49"
          strokeWidth={2}
          dot={{ fill: "#006c49", r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
