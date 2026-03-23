"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChangePlanModal } from "./change-plan-modal";

type Plan = "starter" | "business" | "premium";
type Status = "active" | "trial" | "expired" | "cancelled";

export interface SubscriberRow {
  id: string;
  business_name: string;
  subscription_plan: Plan;
  subscription_status: string;
  trial_ends_at: string | null;
  conversations_this_month: number;
  created_at: string;
}

interface SubscriberTableProps {
  subscribers: SubscriberRow[];
  onRefresh: () => void;
}

const PLAN_PRICES: Record<Plan, number> = {
  starter: 49,
  business: 149,
  premium: 299,
};

const CONVERSATION_LIMITS: Record<Plan, number> = {
  starter: 100,
  business: 500,
  premium: 2000,
};

const planBadgeStyles: Record<Plan, string> = {
  starter: "bg-surface-container-high text-on-surface-variant",
  business: "bg-secondary/10 text-secondary",
  premium: "bg-primary/10 text-primary",
};

const statusStyles: Record<string, { dot: string; text: string }> = {
  active: { dot: "bg-primary", text: "text-primary" },
  trial: { dot: "bg-secondary", text: "text-secondary" },
  expired: { dot: "bg-destructive", text: "text-destructive" },
  cancelled: { dot: "bg-on-surface-variant", text: "text-on-surface-variant" },
};

const PAGE_SIZE = 20;

type SortField =
  | "business_name"
  | "subscription_plan"
  | "subscription_status"
  | "conversations_this_month"
  | "created_at";

export function SubscriberTable({
  subscribers,
  onRefresh,
}: SubscriberTableProps) {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [changePlan, setChangePlan] = useState<{
    tenantId: string;
    businessName: string;
    currentPlan: Plan;
  } | null>(null);

  const filtered = useMemo(() => {
    let result = [...subscribers];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.business_name.toLowerCase().includes(q));
    }
    if (planFilter !== "all") {
      result = result.filter((s) => s.subscription_plan === planFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((s) => s.subscription_status === statusFilter);
    }

    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    return result;
  }, [subscribers, search, planFilter, statusFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(0);
  };

  const SortableHead = ({
    field,
    children,
    className,
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead
      className={cn("cursor-pointer select-none", className)}
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
        {children}
        <ArrowUpDown
          className={cn(
            "h-3 w-3",
            sortField === field
              ? "text-on-surface"
              : "text-on-surface-variant/40",
          )}
        />
      </div>
    </TableHead>
  );

  return (
    <>
      <Card className="bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="p-6 border-b border-surface-container-high flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-bold text-on-surface">
            Recent Subscriptions
          </h3>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
              <Input
                placeholder="Search businesses..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="pl-9 w-48 h-9 text-xs"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-32 h-9 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={planFilter}
              onValueChange={(v) => {
                setPlanFilter(v);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-28 h-9 text-xs">
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead field="business_name">Business</SortableHead>
                <SortableHead field="subscription_plan">Plan</SortableHead>
                <TableHead className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Amount
                  </span>
                </TableHead>
                <SortableHead
                  field="subscription_status"
                  className="text-center"
                >
                  Status
                </SortableHead>
                <SortableHead field="conversations_this_month">
                  Conversations
                </SortableHead>
                <SortableHead field="created_at">Start Date</SortableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.map((sub) => {
                const style =
                  statusStyles[sub.subscription_status] || statusStyles.active;
                const limit = CONVERSATION_LIMITS[sub.subscription_plan] || 100;
                const initial = sub.business_name.charAt(0).toUpperCase();

                return (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                          {initial}
                        </div>
                        <span className="text-sm font-semibold text-on-surface">
                          {sub.business_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "px-2 py-1 text-[10px] font-bold rounded uppercase",
                          planBadgeStyles[sub.subscription_plan],
                        )}
                      >
                        {sub.subscription_plan}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm font-medium text-on-surface">
                        {PLAN_PRICES[sub.subscription_plan]}₾
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <span
                          className={cn(
                            "flex items-center gap-1.5 text-xs font-medium",
                            style.text,
                          )}
                        >
                          <div
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              style.dot,
                              sub.subscription_status === "active" &&
                                "animate-pulse",
                            )}
                          />
                          <span className="capitalize">
                            {sub.subscription_status}
                          </span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-on-surface-variant font-mono">
                        {sub.conversations_this_month}/{limit}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[11px] font-mono text-on-surface-variant">
                        {new Date(sub.created_at).toISOString().split("T")[0]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4 text-on-surface-variant" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              setChangePlan({
                                tenantId: sub.id,
                                businessName: sub.business_name,
                                currentPlan: sub.subscription_plan,
                              })
                            }
                          >
                            Change Plan
                          </DropdownMenuItem>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {pageData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-on-surface-variant"
                  >
                    No subscribers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-surface-container-high">
          {pageData.map((sub) => {
            const style =
              statusStyles[sub.subscription_status] || statusStyles.active;
            const limit = CONVERSATION_LIMITS[sub.subscription_plan] || 100;
            const initial = sub.business_name.charAt(0).toUpperCase();

            return (
              <div key={sub.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
                      {initial}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-on-surface block">
                        {sub.business_name}
                      </span>
                      <span
                        className={cn(
                          "flex items-center gap-1 text-[10px] font-medium mt-0.5",
                          style.text,
                        )}
                      >
                        <div
                          className={cn("w-1.5 h-1.5 rounded-full", style.dot)}
                        />
                        <span className="capitalize">
                          {sub.subscription_status}
                        </span>
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-medium text-on-surface">
                    {PLAN_PRICES[sub.subscription_plan]}₾
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
                      planBadgeStyles[sub.subscription_plan],
                    )}
                  >
                    {sub.subscription_plan}
                  </span>
                  <span className="font-mono">
                    {sub.conversations_this_month}/{limit} convos
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-surface-container-high flex justify-between items-center bg-surface-container-low/20">
          <span className="text-xs text-on-surface-variant">
            Showing {pageData.length} of {filtered.length} subscriptions
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum + 1}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {changePlan && (
        <ChangePlanModal
          open={!!changePlan}
          onOpenChange={(open) => {
            if (!open) setChangePlan(null);
          }}
          tenantId={changePlan.tenantId}
          businessName={changePlan.businessName}
          currentPlan={changePlan.currentPlan}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
}
