"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const AdsConversationsChart = dynamic(
  () =>
    import("./ads-conversations-chart").then((m) => m.AdsConversationsChart),
  { ssr: false, loading: () => <Skeleton className="h-[200px]" /> },
);

interface InsightCard {
  label: string;
  headline: string;
  description: string;
}

interface SxartiInsightsProps {
  chartData: { date: string; spend: number; conversations: number }[];
  insights: InsightCard[];
}

export function SxartiInsights({ chartData, insights }: SxartiInsightsProps) {
  const hasData =
    chartData.length > 0 && chartData.some((d) => d.conversations > 0);

  return (
    <section className="rounded-2xl border-l-4 border-primary bg-surface-container-low p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="text-xl text-primary">&#128161;</span>
        <h4 className="text-xl font-bold text-on-surface">
          სხარტი ინსაიტები: რეკლამა ↔ საუბრები
        </h4>
      </div>

      {hasData ? (
        <>
          <div className="mb-6">
            <AdsConversationsChart data={chartData} />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {insights.map((insight, i) => (
              <div
                key={i}
                className="rounded-xl bg-white/70 p-6 shadow-sm backdrop-blur-sm transition-all hover:translate-y-[-4px] hover:shadow-md"
              >
                <p className="mb-2 text-xs font-bold text-on-surface-variant">
                  {insight.label}
                </p>
                <h5 className="text-xl font-black text-on-surface">
                  {insight.headline}
                </h5>
                <p className="mt-2 text-[10px] text-on-surface-variant">
                  {insight.description}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="py-4 text-center text-sm text-on-surface-variant">
          საუბრების მონაცემები ჯერ არ არის. როცა კლიენტები მოგწერენ
          Messenger-ზე, კორელაცია ავტომატურად გამოჩნდება.
        </p>
      )}
    </section>
  );
}
