"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";
import { AdminUser } from "@/types/admin";

interface TicketFiltersProps {
  admins: AdminUser[];
}

export function TicketFilters({ admins }: TicketFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);

  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "";
  const currentPriority = searchParams.get("priority") || "";
  const currentAssigned = searchParams.get("assigned") || "";
  const currentCategory = searchParams.get("category") || "";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`/admin/support?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  const clearFilters = () => {
    startTransition(() => {
      router.push("/admin/support");
    });
  };

  const hasFilters =
    currentSearch ||
    currentStatus ||
    currentPriority ||
    currentAssigned ||
    currentCategory;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <Input
            placeholder="Search tickets..."
            defaultValue={currentSearch}
            onChange={(e) => {
              const value = e.target.value;
              const timeout = setTimeout(
                () => updateParam("search", value),
                300,
              );
              return () => clearTimeout(timeout);
            }}
            className="pl-9"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? "bg-surface-container-low" : ""}
        >
          <Filter className="h-4 w-4 mr-1.5" />
          Filters
        </Button>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}

        {isPending && (
          <span className="text-xs text-on-surface-variant animate-pulse">
            Loading...
          </span>
        )}
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-surface-container-low rounded-lg">
          <Select
            value={currentStatus}
            onValueChange={(v) => updateParam("status", v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="waiting">Waiting</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={currentPriority}
            onValueChange={(v) => updateParam("priority", v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={currentAssigned}
            onValueChange={(v) => updateParam("assigned", v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <SelectValue placeholder="Assigned To" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {admins.map((admin) => (
                <SelectItem key={admin.id} value={admin.id}>
                  {admin.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentCategory}
            onValueChange={(v) => updateParam("category", v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="bot">Bot</SelectItem>
              <SelectItem value="account">Account</SelectItem>
              <SelectItem value="feature_request">Feature Request</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
