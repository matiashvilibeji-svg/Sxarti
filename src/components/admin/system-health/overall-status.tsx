"use client";

import { SystemHealthCheck } from "@/types/admin";
import { Activity, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface OverallStatusProps {
  healthChecks: SystemHealthCheck[];
}

function computeOverallStatus(checks: SystemHealthCheck[]) {
  if (checks.length === 0) return "unknown";
  if (checks.some((c) => c.status === "down")) return "down";
  if (checks.some((c) => c.status === "degraded")) return "degraded";
  return "healthy";
}

function computeUptime(checks: SystemHealthCheck[]) {
  if (checks.length === 0) return 0;
  const healthy = checks.filter((c) => c.status === "healthy").length;
  return Math.round((healthy / checks.length) * 10000) / 100;
}

const statusConfig = {
  healthy: {
    label: "All Systems Operational",
    color: "bg-primary/5 border-primary",
    dotColor: "bg-primary",
    icon: CheckCircle2,
    iconColor: "text-primary",
  },
  degraded: {
    label: "Partial Degradation",
    color: "bg-amber-50 border-amber-500",
    dotColor: "bg-amber-500",
    icon: AlertTriangle,
    iconColor: "text-amber-600",
  },
  down: {
    label: "Major Outage",
    color: "bg-red-50 border-red-500",
    dotColor: "bg-red-500",
    icon: XCircle,
    iconColor: "text-red-600",
  },
  unknown: {
    label: "No Data Available",
    color: "bg-surface-container-low border-outline-variant",
    dotColor: "bg-outline-variant",
    icon: Activity,
    iconColor: "text-on-surface-variant",
  },
};

export function OverallStatus({ healthChecks }: OverallStatusProps) {
  const overall = computeOverallStatus(healthChecks);
  const uptime = computeUptime(healthChecks);
  const config = statusConfig[overall];
  const lastChecked =
    healthChecks.length > 0
      ? new Date(healthChecks[0].checked_at).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      : "N/A";

  return (
    <div
      className={`${config.color} border-l-4 p-6 flex items-center justify-between rounded-r-xl`}
    >
      <div className="flex items-center gap-4">
        <div className="relative flex h-3 w-3">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dotColor} opacity-75`}
          />
          <span
            className={`relative inline-flex rounded-full h-3 w-3 ${config.dotColor}`}
          />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-on-surface">
            {config.label}
          </h2>
          <p className="text-sm text-on-surface-variant">
            Last checked <span className="font-mono">{lastChecked}</span>
            {uptime > 0 && (
              <span className="ml-3">
                Uptime:{" "}
                <span className="font-mono font-semibold">{uptime}%</span>
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="hidden sm:flex gap-2">
        <button className="px-4 py-2 bg-surface-container-lowest text-xs font-semibold rounded-lg shadow-sm hover:bg-surface-container-low transition-colors">
          View Uptime History
        </button>
        <button className="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-lg shadow-sm hover:opacity-90 transition-colors">
          Run Diagnostics
        </button>
      </div>
    </div>
  );
}
