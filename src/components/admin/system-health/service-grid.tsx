"use client";

import { SystemHealthCheck } from "@/types/admin";
import {
  Database,
  Shield,
  HardDrive,
  Bot,
  Webhook,
  Instagram,
  Cloud,
  Sheet,
} from "lucide-react";

interface ServiceGridProps {
  healthChecks: SystemHealthCheck[];
  historicalChecks: SystemHealthCheck[];
}

const serviceConfig: Record<
  string,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  "Supabase Database": {
    icon: Database,
    color: "text-primary",
    bgColor: "bg-teal-50",
  },
  "Supabase Auth": {
    icon: Shield,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  "Supabase Storage": {
    icon: HardDrive,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  "AI Bot (Gemini)": {
    icon: Bot,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  "Facebook Webhooks": {
    icon: Webhook,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  "Instagram Webhooks": {
    icon: Instagram,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
  },
  "Edge Functions": {
    icon: Cloud,
    color: "text-slate-900",
    bgColor: "bg-slate-50",
  },
  "Google Sheets Sync": {
    icon: Sheet,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
};

const statusBadge: Record<string, { bg: string; text: string; label: string }> =
  {
    healthy: { bg: "bg-teal-100", text: "text-teal-800", label: "OPERATIONAL" },
    degraded: { bg: "bg-amber-100", text: "text-amber-800", label: "DEGRADED" },
    down: { bg: "bg-red-100", text: "text-red-800", label: "DOWN" },
  };

function Sparkline({ data }: { data: number[] }) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  return (
    <div className="mt-4 h-8 flex items-end gap-0.5">
      {data.slice(-6).map((val, i) => (
        <div
          key={i}
          className="w-full bg-current opacity-20 rounded-t-sm transition-all"
          style={{ height: `${Math.max((val / max) * 100, 10)}%` }}
        />
      ))}
    </div>
  );
}

export function ServiceGrid({
  healthChecks,
  historicalChecks,
}: ServiceGridProps) {
  const serviceNames = Object.keys(serviceConfig);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {serviceNames.map((name) => {
        const check = healthChecks.find((c) => c.service_name === name);
        const config = serviceConfig[name];
        const Icon = config.icon;
        const status = check?.status ?? "down";
        const badge = statusBadge[status] ?? statusBadge.down;
        const responseTime = check?.response_time_ms;
        const history = historicalChecks
          .filter((c) => c.service_name === name)
          .map((c) => c.response_time_ms ?? 0);

        return (
          <div
            key={name}
            className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-transparent hover:border-outline-variant/30 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className={`p-2 ${config.bgColor} rounded-lg ${config.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div
                className={`text-[10px] font-mono ${badge.bg} ${badge.text} px-2 py-0.5 rounded`}
              >
                {badge.label}
              </div>
            </div>
            <h3 className="text-sm font-bold">
              {name.replace("Supabase ", "").replace("(Gemini)", "")}
            </h3>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold">
                {responseTime != null ? responseTime : "—"}
              </span>
              <span className="text-[10px] text-on-surface-variant uppercase">
                ms latency
              </span>
            </div>
            <div className={config.color}>
              <Sparkline data={history} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
