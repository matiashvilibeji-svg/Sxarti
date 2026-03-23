"use client";

import { SystemHealthCheck } from "@/types/admin";

interface ResponseTimeChartProps {
  historicalChecks: SystemHealthCheck[];
}

export function ResponseTimeChart({
  historicalChecks,
}: ResponseTimeChartProps) {
  // Group by time bucket (every 2 hours for last 24h)
  const now = new Date();
  const buckets: { label: string; avgMs: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const bucketEnd = new Date(now.getTime() - i * 2 * 60 * 60 * 1000);
    const bucketStart = new Date(bucketEnd.getTime() - 2 * 60 * 60 * 1000);
    const checksInBucket = historicalChecks.filter((c) => {
      const t = new Date(c.checked_at).getTime();
      return t >= bucketStart.getTime() && t < bucketEnd.getTime();
    });
    const avg =
      checksInBucket.length > 0
        ? checksInBucket.reduce(
            (sum, c) => sum + (c.response_time_ms ?? 0),
            0,
          ) / checksInBucket.length
        : 0;
    buckets.push({
      label: bucketEnd.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      avgMs: Math.round(avg),
    });
  }

  const maxMs = Math.max(...buckets.map((b) => b.avgMs), 100);

  // Calculate token-like stats
  const totalChecks = historicalChecks.length;
  const avgResponseTime =
    totalChecks > 0
      ? Math.round(
          historicalChecks.reduce(
            (sum, c) => sum + (c.response_time_ms ?? 0),
            0,
          ) / totalChecks,
        )
      : 0;

  return (
    <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-semibold">Response Time Overview</h3>
          <p className="text-xs text-on-surface-variant">
            Aggregated response times across all services
          </p>
        </div>
        <span className="text-xs font-semibold text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg">
          Last 24 Hours
        </span>
      </div>

      {/* Bar chart */}
      <div className="relative h-64 w-full flex items-end justify-between gap-4 px-2">
        {/* Threshold lines */}
        <div
          className="absolute left-0 right-0 border-t border-dashed border-green-300"
          style={{ bottom: `${(200 / maxMs) * 100}%` }}
        >
          <span className="absolute -top-3 right-0 text-[9px] text-green-600 font-mono">
            200ms
          </span>
        </div>
        {maxMs > 500 && (
          <div
            className="absolute left-0 right-0 border-t border-dashed border-red-300"
            style={{ bottom: `${(500 / maxMs) * 100}%` }}
          >
            <span className="absolute -top-3 right-0 text-[9px] text-red-600 font-mono">
              500ms
            </span>
          </div>
        )}

        {buckets.map((bucket, i) => {
          const height = maxMs > 0 ? (bucket.avgMs / maxMs) * 100 : 0;
          const isLast = i === buckets.length - 1;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col justify-end items-center gap-2 group"
            >
              <div
                className={`w-full rounded-t-lg transition-colors ${
                  isLast ? "bg-primary" : "bg-primary/10 group-hover:bg-primary"
                }`}
                style={{ height: `${Math.max(height, 4)}%` }}
              />
              <span className="text-[10px] font-mono text-on-surface-variant">
                {bucket.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="mt-8 grid grid-cols-2 gap-4 border-t border-surface-container-high pt-6">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1">
            Total Health Checks
          </p>
          <p className="text-xl font-mono font-bold">
            {totalChecks.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1">
            Avg Response Time
          </p>
          <p className="text-xl font-mono font-bold">
            {avgResponseTime}
            <span className="text-xs text-on-surface-variant ml-1">ms</span>
          </p>
        </div>
      </div>
    </div>
  );
}
