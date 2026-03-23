"use client";

import { useState, useMemo } from "react";
import { Search, X, Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TenantOption {
  id: string;
  business_name: string;
}

interface TenantPickerProps {
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  tenants: TenantOption[];
}

export function TenantPicker({
  selectedIds,
  onSelect,
  tenants,
}: TenantPickerProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () =>
      tenants.filter((t) =>
        t.business_name.toLowerCase().includes(search.toLowerCase()),
      ),
    [tenants, search],
  );

  const selectedTenants = tenants.filter((t) => selectedIds.includes(t.id));

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onSelect(selectedIds.filter((i) => i !== id));
    } else {
      onSelect([...selectedIds, id]);
    }
  }

  return (
    <div className="space-y-2">
      {selectedTenants.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTenants.map((t) => (
            <Badge
              key={t.id}
              variant="secondary"
              className="bg-primary/10 text-primary gap-1 pr-1"
            >
              {t.business_name}
              <button
                type="button"
                onClick={() => toggle(t.id)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-surface-container-lowest px-3 py-2 text-sm hover:bg-surface-container-low transition-colors"
        >
          <span className="text-on-surface-variant">
            {selectedIds.length === 0
              ? "Select tenants..."
              : `${selectedIds.length} selected`}
          </span>
          <ChevronsUpDown className="h-4 w-4 text-on-surface-variant" />
        </button>

        {open && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-surface-container-lowest shadow-lg">
            <div className="flex items-center border-b border-slate-100 px-3">
              <Search className="h-4 w-4 text-on-surface-variant" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tenants..."
                className="flex-1 border-none bg-transparent px-2 py-2 text-sm focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-1.5">
              <button
                type="button"
                onClick={() => onSelect(tenants.map((t) => t.id))}
                className="text-xs text-primary hover:underline"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => onSelect([])}
                className="text-xs text-on-surface-variant hover:underline"
              >
                Clear All
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-sm text-on-surface-variant">
                  No tenants found
                </p>
              ) : (
                filtered.map((t) => {
                  const selected = selectedIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggle(t.id)}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-surface-container-low transition-colors",
                        selected && "bg-primary/5",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded border",
                          selected
                            ? "border-primary bg-primary text-white"
                            : "border-slate-300",
                        )}
                      >
                        {selected && <Check className="h-3 w-3" />}
                      </div>
                      <span>{t.business_name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
