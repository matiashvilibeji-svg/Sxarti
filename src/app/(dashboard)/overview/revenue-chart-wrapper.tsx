"use client";

import { RevenueChart } from "@/components/dashboard/revenue-chart";

interface RevenueChartWrapperProps {
  data: {
    date: string;
    conversations: number;
    orders: number;
    revenue: number;
  }[];
}

export function RevenueChartWrapper({ data }: RevenueChartWrapperProps) {
  return <RevenueChart data={data} />;
}
