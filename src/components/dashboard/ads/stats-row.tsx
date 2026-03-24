"use client";

import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StatItem {
  label: string;
  value: string;
  change: number; // positive = up, negative = down
  borderColor: string;
}

interface StatsRowProps {
  stats: StatItem[];
}

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <section className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:overflow-visible md:px-0 md:pb-0">
      <div className="flex gap-4 md:grid md:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "min-w-[140px] shrink-0 rounded-2xl border-l-4 bg-white/80 p-5 shadow-sm backdrop-blur-sm md:min-w-0 md:shrink",
              stat.borderColor,
            )}
          >
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              {stat.label}
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-on-surface">
                {stat.value}
              </h3>
              <span
                className={cn(
                  "flex items-center text-[10px] font-bold",
                  stat.change >= 0 ? "text-[#006c49]" : "text-[#ba1a1a]",
                )}
              >
                {stat.change >= 0 ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                {Math.abs(stat.change)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
