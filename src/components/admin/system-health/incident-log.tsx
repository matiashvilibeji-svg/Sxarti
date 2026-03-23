"use client";

import { useState } from "react";
import { SystemHealthCheck } from "@/types/admin";

interface IncidentLogProps {
  incidents: SystemHealthCheck[];
}

const statusColors: Record<string, { dot: string; text: string }> = {
  degraded: { dot: "bg-amber-500", text: "text-amber-700" },
  down: { dot: "bg-red-500", text: "text-red-700" },
};

export function IncidentLog({ incidents }: IncidentLogProps) {
  const [serviceFilter, setServiceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const services = Array.from(new Set(incidents.map((i) => i.service_name)));

  const filtered = incidents.filter((i) => {
    if (serviceFilter && i.service_name !== serviceFilter) return false;
    if (statusFilter && i.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm">
      <div className="p-6 border-b border-surface-container-high flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Incident History</h3>
          {filtered.length > 0 && (
            <span className="bg-red-50 text-red-700 text-[10px] px-2 py-0.5 rounded font-bold">
              {filtered.length} EVENTS
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <select
            className="bg-surface-container-low border-none text-xs font-semibold rounded-lg px-3 py-1.5 focus:ring-primary"
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
          >
            <option value="">All Services</option>
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="bg-surface-container-low border-none text-xs font-semibold rounded-lg px-3 py-1.5 focus:ring-primary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="degraded">Degraded</option>
            <option value="down">Down</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center text-sm text-on-surface-variant">
          No incidents found. All systems running smoothly.
        </div>
      ) : (
        <div className="p-6 space-y-6">
          {filtered.slice(0, 50).map((incident, i) => {
            const colors = statusColors[incident.status] ?? statusColors.down;
            const isLast = i === filtered.length - 1;
            return (
              <div key={incident.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-2 h-2 rounded-full ${colors.dot} mt-1.5`}
                  />
                  {!isLast && (
                    <div className="w-px flex-1 bg-surface-container-high my-1" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-mono text-on-surface-variant">
                    {new Date(incident.checked_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className={`text-sm font-bold ${colors.text}`}>
                    {incident.service_name} — {incident.status.toUpperCase()}
                  </p>
                  {incident.response_time_ms != null && (
                    <p className="text-xs text-on-surface-variant mt-1">
                      Response time: {incident.response_time_ms}ms
                      {incident.details &&
                        Object.keys(incident.details).length > 0 && (
                          <span className="ml-2">
                            {JSON.stringify(incident.details)}
                          </span>
                        )}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
