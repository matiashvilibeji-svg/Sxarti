"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdSetRow {
  id: string;
  name: string;
  status: string;
}

interface CampaignRow {
  id: string;
  name: string;
  status: string;
  budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  roas: number;
  adSets?: AdSetRow[];
}

interface CampaignTableProps {
  campaigns: CampaignRow[];
}

type SortKey = keyof Pick<
  CampaignRow,
  "spend" | "ctr" | "conversions" | "roas" | "clicks" | "impressions"
>;

const statusDotColor: Record<string, string> = {
  ACTIVE: "bg-[#006c49] shadow-[0_0_8px_rgba(0,108,73,0.5)]",
  PAUSED: "bg-orange-400",
  DELETED: "bg-slate-300",
  ARCHIVED: "bg-slate-300",
};

const statusFilters = [
  { value: "all", label: "ყველა" },
  { value: "ACTIVE", label: "აქტიური" },
  { value: "PAUSED", label: "შეჩერებული" },
  { value: "DELETED", label: "დასრულებული" },
];

export function CampaignTable({ campaigns }: CampaignTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("roas");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    let result = campaigns;

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return result;
  }, [campaigns, search, statusFilter, sortKey, sortDir]);

  const SortIcon = ({ field }: { field: SortKey }) => {
    if (sortKey !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="inline h-3 w-3" />
    ) : (
      <ChevronDown className="inline h-3 w-3" />
    );
  };

  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="text-xl font-bold text-on-surface">
          კამპანიების ეფექტურობა
        </h4>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="ძიება..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="კამპანიის ძიება"
              className="rounded-lg bg-surface-container-low py-2 pl-9 pr-3 text-xs outline-none ring-1 ring-transparent focus:ring-primary"
            />
          </div>
          <div
            className="flex rounded-lg bg-surface-container-low p-0.5"
            role="group"
            aria-label="სტატუსის ფილტრი"
          >
            {statusFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                aria-pressed={statusFilter === f.value}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[10px] font-bold transition-colors",
                  statusFilter === f.value
                    ? "bg-white text-primary shadow-sm"
                    : "text-on-surface-variant",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left">
          <thead className="rounded-lg bg-surface-container-low text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            <tr>
              <th className="rounded-l-lg px-3 py-3">კამპანია</th>
              <th className="px-3 py-3">ბიუჯეტი</th>
              <th
                className="cursor-pointer select-none px-3 py-3"
                onClick={() => toggleSort("spend")}
                onKeyDown={(e) => e.key === "Enter" && toggleSort("spend")}
                tabIndex={0}
                aria-sort={
                  sortKey === "spend"
                    ? sortDir === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                დახარჯ. <SortIcon field="spend" />
              </th>
              <th
                className="cursor-pointer select-none px-3 py-3"
                onClick={() => toggleSort("impressions")}
                onKeyDown={(e) =>
                  e.key === "Enter" && toggleSort("impressions")
                }
                tabIndex={0}
                aria-sort={
                  sortKey === "impressions"
                    ? sortDir === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                შთაბეჭდ. <SortIcon field="impressions" />
              </th>
              <th
                className="cursor-pointer select-none px-3 py-3"
                onClick={() => toggleSort("clicks")}
                onKeyDown={(e) => e.key === "Enter" && toggleSort("clicks")}
                tabIndex={0}
                aria-sort={
                  sortKey === "clicks"
                    ? sortDir === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                კლიკი <SortIcon field="clicks" />
              </th>
              <th
                className="cursor-pointer select-none px-3 py-3"
                onClick={() => toggleSort("ctr")}
                onKeyDown={(e) => e.key === "Enter" && toggleSort("ctr")}
                tabIndex={0}
                aria-sort={
                  sortKey === "ctr"
                    ? sortDir === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                CTR <SortIcon field="ctr" />
              </th>
              <th className="px-3 py-3">CPC</th>
              <th
                className="cursor-pointer select-none px-3 py-3"
                onClick={() => toggleSort("conversions")}
                onKeyDown={(e) =>
                  e.key === "Enter" && toggleSort("conversions")
                }
                tabIndex={0}
                aria-sort={
                  sortKey === "conversions"
                    ? sortDir === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                კონვ. <SortIcon field="conversions" />
              </th>
              <th
                className="cursor-pointer select-none rounded-r-lg px-3 py-3"
                onClick={() => toggleSort("roas")}
                onKeyDown={(e) => e.key === "Enter" && toggleSort("roas")}
                tabIndex={0}
                aria-sort={
                  sortKey === "roas"
                    ? sortDir === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                ROAS <SortIcon field="roas" />
              </th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filtered.map((c) => {
              const isExpanded = expandedId === c.id;
              const hasAdSets = c.adSets && c.adSets.length > 0;
              return (
                <React.Fragment key={c.id}>
                  <tr
                    onClick={() =>
                      hasAdSets && setExpandedId(isExpanded ? null : c.id)
                    }
                    onKeyDown={(e) =>
                      hasAdSets &&
                      e.key === "Enter" &&
                      setExpandedId(isExpanded ? null : c.id)
                    }
                    tabIndex={hasAdSets ? 0 : undefined}
                    aria-expanded={hasAdSets ? isExpanded : undefined}
                    className={cn(
                      "group transition-colors hover:bg-surface-container-low",
                      hasAdSets && "cursor-pointer",
                    )}
                  >
                    <td className="flex items-center gap-2 px-3 py-4 font-bold">
                      {hasAdSets && (
                        <ChevronRight
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 text-on-surface-variant transition-transform",
                            isExpanded && "rotate-90",
                          )}
                        />
                      )}
                      <span
                        className={cn(
                          "h-2.5 w-2.5 shrink-0 rounded-full",
                          statusDotColor[c.status] ?? "bg-slate-300",
                        )}
                      />
                      <span className="truncate">{c.name}</span>
                    </td>
                    <td className="px-3 py-4 font-medium text-on-surface-variant">
                      {c.budget > 0 ? `${c.budget.toFixed(0)} ₾` : "—"}
                    </td>
                    <td className="px-3 py-4 font-medium">
                      {c.spend.toFixed(0)} ₾
                    </td>
                    <td className="px-3 py-4 text-on-surface-variant">
                      {c.impressions >= 1000
                        ? `${(c.impressions / 1000).toFixed(1)}K`
                        : c.impressions}
                    </td>
                    <td className="px-3 py-4 text-on-surface-variant">
                      {c.clicks.toLocaleString()}
                    </td>
                    <td
                      className={cn(
                        "px-3 py-4 font-bold",
                        c.ctr >= 3 ? "text-[#006c49]" : "text-[#ba1a1a]",
                      )}
                    >
                      {c.ctr.toFixed(1)}%
                    </td>
                    <td className="px-3 py-4 text-on-surface-variant">
                      {c.cpc.toFixed(2)} ₾
                    </td>
                    <td className="px-3 py-4 font-bold">{c.conversions}</td>
                    <td className="px-3 py-4 font-black text-primary">
                      {c.roas.toFixed(1)}x
                    </td>
                  </tr>
                  {isExpanded &&
                    c.adSets?.map((as) => (
                      <tr key={as.id} className="bg-surface-container-low/50">
                        <td colSpan={9} className="px-3 py-2.5 pl-12 text-xs">
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                statusDotColor[as.status] ?? "bg-slate-300",
                              )}
                            />
                            <span className="font-medium text-on-surface-variant">
                              {as.name}
                            </span>
                            <span className="text-[10px] uppercase text-on-surface-variant/60">
                              {as.status}
                            </span>
                          </span>
                        </td>
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-8 text-center text-sm text-on-surface-variant"
                >
                  კამპანიები ვერ მოიძებნა
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="space-y-3 md:hidden">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-surface-container bg-white p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  statusDotColor[c.status] ?? "bg-slate-300",
                )}
              />
              <span className="text-sm font-bold text-on-surface">
                {c.name}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
              <div>
                <p className="text-[10px] font-bold uppercase text-on-surface-variant">
                  დახარჯული
                </p>
                <p className="text-sm font-bold">{c.spend.toFixed(0)} ₾</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-on-surface-variant">
                  კლიკი
                </p>
                <p className="text-sm font-bold">{c.clicks.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-on-surface-variant">
                  CTR
                </p>
                <p className="text-sm font-bold">{c.ctr.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-on-surface-variant">
                  ROAS
                </p>
                <p className="text-sm font-black text-primary">
                  {c.roas.toFixed(1)}x
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
