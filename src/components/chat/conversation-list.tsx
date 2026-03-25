"use client";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ConversationItem } from "./conversation-item";

type StatusFilter = "all" | Conversation["status"];

const filters: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "ყველა" },
  { key: "active", label: "აქტიური" },
  { key: "handoff", label: "აკონტროლე" },
  { key: "completed", label: "დასრულებული" },
];

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({
  conversations,
  loading,
  selectedId,
  onSelect,
}: ConversationListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    let result = conversations;

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.customer_name?.toLowerCase().includes(q));
    }

    return result;
  }, [conversations, statusFilter, search]);

  return (
    <div className="flex h-full flex-col">
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/60" />
          <Input
            placeholder="ძიება..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
      </div>

      {/* Status filters */}
      <div className="flex gap-1 px-3 pb-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={cn(
              "rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors",
              statusFilter === f.key
                ? "bg-primary text-primary-foreground"
                : "text-on-surface-variant/70 hover:bg-surface-container-high",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="px-1.5 pb-2">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-3 py-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <div className="flex gap-1.5">
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-on-surface-variant/60">
              საუბრები არ მოიძებნა
            </p>
          ) : (
            filtered.map((c) => (
              <ConversationItem
                key={c.id}
                conversation={c}
                isSelected={selectedId === c.id}
                onClick={() => onSelect(c.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
