"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TenantPicker } from "./tenant-picker";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { FeatureFlag } from "@/types/admin";

interface TenantOption {
  id: string;
  business_name: string;
}

interface CreateFlagModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (flag: FeatureFlag) => void;
  tenants: TenantOption[];
}

type TargetingMode = "all" | "tenants" | "plans" | "percentage";

const PLAN_OPTIONS = ["starter", "business", "premium"] as const;

function toSnakeCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export function CreateFlagModal({
  open,
  onOpenChange,
  onCreated,
  tenants,
}: CreateFlagModalProps) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [keyEdited, setKeyEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<TargetingMode>("all");
  const [tenantIds, setTenantIds] = useState<string[]>([]);
  const [plans, setPlans] = useState<(typeof PLAN_OPTIONS)[number][]>([]);
  const [percentage, setPercentage] = useState(100);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  function handleNameChange(value: string) {
    setName(value);
    if (!keyEdited) {
      setKey(toSnakeCase(value));
    }
  }

  function reset() {
    setName("");
    setKey("");
    setKeyEdited(false);
    setDescription("");
    setEnabled(false);
    setMode("all");
    setTenantIds([]);
    setPlans([]);
    setPercentage(100);
    setError("");
  }

  async function handleCreate() {
    if (!name.trim() || !key.trim()) {
      setError("Name and key are required");
      return;
    }

    setCreating(true);
    setError("");

    const targeting: FeatureFlag["targeting"] = {};
    if (mode === "tenants") targeting.tenant_ids = tenantIds;
    if (mode === "plans") targeting.plans = [...plans];
    if (mode === "percentage") targeting.percentage = percentage;

    try {
      const supabase = createClient();
      const { data, error: dbError } = await supabase
        .from("feature_flags")
        .insert({
          name: name.trim(),
          key: key.trim(),
          description: description.trim() || null,
          is_enabled: enabled,
          targeting,
        })
        .select()
        .single();

      if (dbError) {
        setError(dbError.message);
        setCreating(false);
        return;
      }

      onCreated(data as FeatureFlag);
      reset();
      onOpenChange(false);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  function togglePlan(plan: (typeof PLAN_OPTIONS)[number]) {
    if (plans.includes(plan)) {
      setPlans(plans.filter((p) => p !== plan));
    } else {
      setPlans([...plans, plan]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-full overflow-y-auto sm:max-h-[90vh] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Feature Flag</DialogTitle>
          <DialogDescription>
            Add a new feature flag to control feature rollout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-on-surface-variant mb-1 block">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Instagram DM support"
            />
          </div>

          {/* Key */}
          <div>
            <label className="text-xs font-medium text-on-surface-variant mb-1 block">
              Key
            </label>
            <Input
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setKeyEdited(true);
              }}
              placeholder="instagram_dm_support"
              className="font-mono text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-on-surface-variant mb-1 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="flex w-full rounded-lg bg-surface-container-lowest px-3 py-2 text-sm ghost-border focus-visible:outline-none focus-visible:bg-surface-container-low transition-all resize-none"
              placeholder="Describe what this flag controls..."
            />
          </div>

          {/* Initial state */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-on-surface">
              Initially enabled
            </label>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {/* Targeting */}
          <div>
            <label className="text-xs font-medium text-on-surface-variant mb-2 block">
              Targeting
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {(
                [
                  { value: "all", label: "All Tenants" },
                  { value: "tenants", label: "Specific Tenants" },
                  { value: "plans", label: "By Plan" },
                  { value: "percentage", label: "Percentage" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMode(opt.value)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                    mode === opt.value
                      ? "bg-primary text-white"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {mode === "tenants" && (
              <TenantPicker
                selectedIds={tenantIds}
                onSelect={setTenantIds}
                tenants={tenants}
              />
            )}

            {mode === "plans" && (
              <div className="flex gap-3">
                {PLAN_OPTIONS.map((plan) => (
                  <label
                    key={plan}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={plans.includes(plan)}
                      onChange={() => togglePlan(plan)}
                      className="rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm capitalize">{plan}</span>
                  </label>
                ))}
              </div>
            )}

            {mode === "percentage" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">
                    Rollout Percentage
                  </span>
                  <span className="font-mono text-sm font-bold text-primary">
                    {percentage}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={percentage}
                  onChange={(e) => setPercentage(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            Create Flag
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
