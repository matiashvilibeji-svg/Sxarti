"use client";

import { useState } from "react";
import { AuditLogEntry } from "@/types/admin";

interface AuditTrailProps {
  entries: AuditLogEntry[];
}

const actionColors: Record<string, { bg: string; text: string }> = {
  create: { bg: "bg-teal-50", text: "text-teal-700" },
  update: { bg: "bg-amber-50", text: "text-amber-700" },
  delete: { bg: "bg-red-50", text: "text-red-700" },
  login: { bg: "bg-blue-50", text: "text-blue-700" },
  security: { bg: "bg-red-50", text: "text-red-700" },
};

function getActionColor(action: string) {
  const key = Object.keys(actionColors).find((k) =>
    action.toLowerCase().includes(k),
  );
  return actionColors[key ?? ""] ?? { bg: "bg-teal-50", text: "text-teal-700" };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AuditTrail({ entries }: AuditTrailProps) {
  const [page, setPage] = useState(0);
  const perPage = 20;
  const totalPages = Math.ceil(entries.length / perPage);
  const pageEntries = entries.slice(page * perPage, (page + 1) * perPage);

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Audit Log</h3>
        <button className="text-primary text-xs font-bold uppercase flex items-center gap-1 hover:underline">
          Export CSV
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/10">
        {/* Header */}
        <div className="grid grid-cols-12 bg-surface-container-low py-3 px-6 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest border-b border-surface-container-high">
          <div className="col-span-3">User</div>
          <div className="col-span-5">Action</div>
          <div className="col-span-2 hidden md:block">IP Address</div>
          <div className="col-span-2 text-right">Timestamp</div>
        </div>

        {/* Entries */}
        <div className="divide-y divide-surface-container-high">
          {pageEntries.length === 0 ? (
            <div className="py-12 text-center text-sm text-on-surface-variant">
              No audit log entries found.
            </div>
          ) : (
            pageEntries.map((entry) => {
              const adminName = entry.admin?.display_name ?? "System";
              const color = getActionColor(entry.action);
              return (
                <div
                  key={entry.id}
                  className="grid grid-cols-12 py-4 px-6 items-center text-sm hover:bg-surface-container-low/30 transition-colors"
                >
                  <div className="col-span-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                      {getInitials(adminName)}
                    </span>
                    <span className="font-medium text-xs truncate">
                      {adminName}
                    </span>
                  </div>
                  <div className="col-span-5 flex items-center gap-2 overflow-hidden">
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full ${color.bg} ${color.text} text-[10px] font-bold`}
                    >
                      {entry.action}
                    </span>
                    <span className="text-on-surface-variant text-xs truncate">
                      {entry.resource_type}
                      {entry.resource_id && (
                        <code className="bg-surface-container-low px-1 rounded text-[10px] font-mono ml-1">
                          {entry.resource_id}
                        </code>
                      )}
                    </span>
                  </div>
                  <div className="col-span-2 hidden md:block font-mono text-[10px] text-on-surface-variant">
                    {entry.ip_address ?? "—"}
                  </div>
                  <div className="col-span-2 text-right font-mono text-[10px] text-on-surface-variant">
                    {new Date(entry.created_at).toLocaleString("en-US", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-surface-container-low py-3 px-6 flex items-center justify-between">
            <span className="text-xs text-on-surface-variant">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                className="text-xs font-bold text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                className="text-xs font-bold text-primary hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
