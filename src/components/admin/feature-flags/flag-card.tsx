"use client";

import { useState } from "react";
import { ChevronDown, Trash2, Save, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TenantPicker } from "./tenant-picker";
import { cn } from "@/lib/utils";
import type { FeatureFlag } from "@/types/admin";

interface TenantOption {
  id: string;
  business_name: string;
}

interface FlagCardProps {
  flag: FeatureFlag;
  tenants: TenantOption[];
  onUpdate: (flag: FeatureFlag) => void;
  onDelete: (id: string) => void;
}

type TargetingMode = "all" | "tenants" | "plans" | "percentage";

function getTargetingMode(flag: FeatureFlag): TargetingMode {
  if (flag.targeting.tenant_ids && flag.targeting.tenant_ids.length > 0)
    return "tenants";
  if (flag.targeting.plans && flag.targeting.plans.length > 0) return "plans";
  if (flag.targeting.percentage !== undefined) return "percentage";
  return "all";
}

function getTargetingSummary(flag: FeatureFlag, tenantCount?: number): string {
  const mode = getTargetingMode(flag);
  switch (mode) {
    case "tenants":
      return `${flag.targeting.tenant_ids!.length} tenant${flag.targeting.tenant_ids!.length !== 1 ? "s" : ""}`;
    case "plans":
      return flag.targeting
        .plans!.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(", ");
    case "percentage":
      return `${flag.targeting.percentage}% rollout`;
    default:
      return "All tenants";
  }
}

const PLAN_OPTIONS = ["starter", "business", "premium"] as const;

export function FlagCard({ flag, tenants, onUpdate, onDelete }: FlagCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [description, setDescription] = useState(flag.description || "");
  const [mode, setMode] = useState<TargetingMode>(getTargetingMode(flag));
  const [tenantIds, setTenantIds] = useState<string[]>(
    flag.targeting.tenant_ids || [],
  );
  const [plans, setPlans] = useState<(typeof PLAN_OPTIONS)[number][]>(
    flag.targeting.plans || [],
  );
  const [percentage, setPercentage] = useState(
    flag.targeting.percentage ?? 100,
  );

  async function handleToggle(checked: boolean) {
    const updated = { ...flag, is_enabled: checked };
    onUpdate(updated);
  }

  async function handleSave() {
    setSaving(true);
    const targeting: FeatureFlag["targeting"] = {};
    if (mode === "tenants") targeting.tenant_ids = tenantIds;
    if (mode === "plans") targeting.plans = [...plans];
    if (mode === "percentage") targeting.percentage = percentage;

    const updated: FeatureFlag = {
      ...flag,
      description: description || null,
      targeting,
    };
    onUpdate(updated);
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    onDelete(flag.id);
  }

  function togglePlan(plan: (typeof PLAN_OPTIONS)[number]) {
    if (plans.includes(plan)) {
      setPlans(plans.filter((p) => p !== plan));
    } else {
      setPlans([...plans, plan]);
    }
  }

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200",
        flag.is_enabled
          ? "border-l-4 border-l-primary"
          : "border-l-4 border-l-slate-200",
      )}
    >
      {/* Collapsed view */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-container-low/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Switch
            checked={flag.is_enabled}
            onCheckedChange={handleToggle}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm text-on-surface">
                {flag.name}
              </h3>
              <code className="text-xs text-on-surface-variant font-mono bg-surface-container-low px-1.5 py-0.5 rounded">
                {flag.key}
              </code>
            </div>
            {flag.description && (
              <p className="text-xs text-on-surface-variant mt-0.5 truncate">
                {flag.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 ml-4 shrink-0">
          <Badge
            variant="outline"
            className="text-[10px] bg-surface-container-low border-slate-200 text-on-surface-variant"
          >
            {getTargetingSummary(flag)}
          </Badge>
          <span className="text-[10px] text-on-surface-variant hidden sm:block">
            {formatDistanceToNow(new Date(flag.updated_at), {
              addSuffix: true,
            })}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-on-surface-variant transition-transform",
              expanded && "rotate-180",
            )}
          />
        </div>
      </div>

      {/* Expanded view */}
      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-4 bg-surface-container-low/30">
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

          {/* Metadata */}
          <div className="flex gap-4 text-[10px] text-on-surface-variant">
            <span>
              Created{" "}
              {formatDistanceToNow(new Date(flag.created_at), {
                addSuffix: true,
              })}
            </span>
            <span>
              Updated{" "}
              {formatDistanceToNow(new Date(flag.updated_at), {
                addSuffix: true,
              })}
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className={cn(
                "text-xs",
                confirmDelete
                  ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                  : "text-on-surface-variant",
              )}
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 mr-1" />
              )}
              {confirmDelete ? "Confirm delete?" : "Delete"}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
