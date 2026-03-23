"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface TenantBotRow {
  tenantId: string;
  businessName: string;
  activeConvos: number;
  totalThisMonth: number;
  botResolutionPct: number;
  avgMessages: number;
  lastActivityAt: string | null;
}

interface TenantBotTableProps {
  rows: TenantBotRow[];
}

type SortKey = keyof Omit<TenantBotRow, "tenantId" | "lastActivityAt">;

function StatusDot({ pct }: { pct: number }) {
  const color =
    pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

export function TenantBotTable({ rows }: TenantBotTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalThisMonth");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const perPage = 10;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => r.businessName.toLowerCase().includes(q));
  }, [rows, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortAsc ? av - bv : bv - av;
      }
      return String(av).localeCompare(String(bv)) * (sortAsc ? 1 : -1);
    });
  }, [filtered, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const pageRows = sorted.slice(page * perPage, (page + 1) * perPage);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
    setPage(0);
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return null;
    return sortAsc ? (
      <ChevronUp className="inline h-3 w-3" />
    ) : (
      <ChevronDown className="inline h-3 w-3" />
    );
  }

  function formatTime(iso: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between gap-4">
        <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">
          Per-Tenant Bot Performance
        </h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search business..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-8 pr-3 py-1.5 text-xs rounded-md border border-outline-variant/30 bg-surface-container-low focus:outline-none focus:ring-1 focus:ring-primary/30 w-48"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant">
              <th className="text-left px-4 py-2.5 font-semibold">
                <button
                  onClick={() => handleSort("businessName")}
                  className="flex items-center gap-1"
                >
                  Business <SortIcon col="businessName" />
                </button>
              </th>
              <th className="text-right px-4 py-2.5 font-semibold">
                <button
                  onClick={() => handleSort("activeConvos")}
                  className="flex items-center gap-1 ml-auto"
                >
                  Active <SortIcon col="activeConvos" />
                </button>
              </th>
              <th className="text-right px-4 py-2.5 font-semibold">
                <button
                  onClick={() => handleSort("totalThisMonth")}
                  className="flex items-center gap-1 ml-auto"
                >
                  This Month <SortIcon col="totalThisMonth" />
                </button>
              </th>
              <th className="text-right px-4 py-2.5 font-semibold">
                <button
                  onClick={() => handleSort("botResolutionPct")}
                  className="flex items-center gap-1 ml-auto"
                >
                  Resolution % <SortIcon col="botResolutionPct" />
                </button>
              </th>
              <th className="text-right px-4 py-2.5 font-semibold">
                <button
                  onClick={() => handleSort("avgMessages")}
                  className="flex items-center gap-1 ml-auto"
                >
                  Avg Msgs <SortIcon col="avgMessages" />
                </button>
              </th>
              <th className="text-right px-4 py-2.5 font-semibold">
                Last Activity
              </th>
              <th className="text-center px-4 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-8 text-on-surface-variant"
                >
                  No businesses found
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr
                  key={row.tenantId}
                  className="hover:bg-surface-container-low/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-on-surface">
                    {row.businessName}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {row.activeConvos}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {row.totalThisMonth}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {row.botResolutionPct.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {row.avgMessages.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-right text-on-surface-variant">
                    {formatTime(row.lastActivityAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusDot pct={row.botResolutionPct} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
          <span>
            {sorted.length} result{sorted.length !== 1 && "s"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1 rounded hover:bg-surface-container disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="p-1 rounded hover:bg-surface-container disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
