"use client";

import { useState, useMemo } from "react";
import { Search, Plus, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { FlagCard } from "./flag-card";
import { FlagStats } from "./flag-stats";
import { CreateFlagModal } from "./create-flag-modal";
import { cn } from "@/lib/utils";
import type { FeatureFlag } from "@/types/admin";

interface TenantOption {
  id: string;
  business_name: string;
}

interface FlagListProps {
  initialFlags: FeatureFlag[];
  tenants: TenantOption[];
}

type FilterMode = "all" | "enabled" | "disabled";
type SortMode = "name" | "created" | "updated";

export function FlagList({ initialFlags, tenants }: FlagListProps) {
  const [flags, setFlags] = useState<FeatureFlag[]>(initialFlags);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sort, setSort] = useState<SortMode>("updated");
  const [createOpen, setCreateOpen] = useState(false);

  const supabase = createClient();

  const filtered = useMemo(() => {
    let result = flags;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) || f.key.toLowerCase().includes(q),
      );
    }

    if (filter === "enabled") result = result.filter((f) => f.is_enabled);
    if (filter === "disabled") result = result.filter((f) => !f.is_enabled);

    result = [...result].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "created":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "updated":
        default:
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
      }
    });

    return result;
  }, [flags, search, filter, sort]);

  async function handleUpdate(updated: FeatureFlag) {
    const { error } = await supabase
      .from("feature_flags")
      .update({
        is_enabled: updated.is_enabled,
        description: updated.description,
        targeting: updated.targeting,
        updated_at: new Date().toISOString(),
      })
      .eq("id", updated.id);

    if (!error) {
      setFlags((prev) =>
        prev.map((f) =>
          f.id === updated.id
            ? { ...updated, updated_at: new Date().toISOString() }
            : f,
        ),
      );
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from("feature_flags")
      .delete()
      .eq("id", id);

    if (!error) {
      setFlags((prev) => prev.filter((f) => f.id !== id));
    }
  }

  function handleCreated(flag: FeatureFlag) {
    setFlags((prev) => [flag, ...prev]);
  }

  return (
    <div className="space-y-6">
      <FlagStats flags={flags} />

      {/* Header + controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search flags by name or key..."
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          <div className="flex rounded-lg bg-surface-container-low p-0.5">
            {(
              [
                { value: "all", label: "All" },
                { value: "enabled", label: "Enabled" },
                { value: "disabled", label: "Disabled" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                  filter === opt.value
                    ? "bg-surface-container-lowest text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="h-9 rounded-lg bg-surface-container-low border-none px-3 text-xs font-medium text-on-surface-variant focus:ring-2 focus:ring-primary/20"
          >
            <option value="updated">Recently Updated</option>
            <option value="created">Newest First</option>
            <option value="name">Name A-Z</option>
          </select>

          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Flag
          </Button>
        </div>
      </div>

      {/* Flag list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <SlidersHorizontal className="h-10 w-10 text-on-surface-variant/30 mx-auto mb-3" />
            <p className="text-sm text-on-surface-variant">
              {search || filter !== "all"
                ? "No flags match your filters"
                : "No feature flags yet. Create your first one!"}
            </p>
          </div>
        ) : (
          filtered.map((flag) => (
            <FlagCard
              key={flag.id}
              flag={flag}
              tenants={tenants}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <CreateFlagModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
        tenants={tenants}
      />
    </div>
  );
}
