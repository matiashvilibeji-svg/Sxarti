"use client";

import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

interface PlanLimit {
  id: string;
  plan_id: string;
  monthly_limit: number;
}

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  business: "Business",
  premium: "Premium",
};

const PLAN_ORDER = ["starter", "business", "premium"];

export function WebSearchSettings() {
  const [limits, setLimits] = useState<PlanLimit[]>([]);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const fetchLimits = useCallback(async () => {
    const { data } = await supabase
      .from("web_search_limits")
      .select("*")
      .order("plan_id");

    if (data) {
      const sorted = (data as PlanLimit[]).sort(
        (a, b) => PLAN_ORDER.indexOf(a.plan_id) - PLAN_ORDER.indexOf(b.plan_id),
      );
      setLimits(sorted);
      const values: Record<string, string> = {};
      for (const item of sorted) {
        values[item.plan_id] = String(item.monthly_limit);
      }
      setEditValues(values);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  async function handleSave(planId: string) {
    const value = parseInt(editValues[planId], 10);
    if (isNaN(value) || value < -1) return;

    setSaving(planId);
    await supabase
      .from("web_search_limits")
      .update({ monthly_limit: value, updated_at: new Date().toISOString() })
      .eq("plan_id", planId);

    setLimits((prev) =>
      prev.map((l) =>
        l.plan_id === planId ? { ...l, monthly_limit: value } : l,
      ),
    );
    setSaving(null);
  }

  function formatLimitDisplay(limit: number): string {
    if (limit === -1) return "Unlimited";
    if (limit === 0) return "Disabled";
    return `${limit}/month`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-on-surface-variant/50" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 space-y-6">
        <div>
          <h3 className="font-semibold text-lg">Web Search Limits</h3>
          <p className="text-sm text-on-surface-variant mt-1">
            Configure monthly web search limits per subscription plan. Use -1
            for unlimited, 0 to disable.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/20">
                <th className="pb-3 text-left text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Plan
                </th>
                <th className="pb-3 text-left text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Current Limit
                </th>
                <th className="pb-3 text-left text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Monthly Limit
                </th>
                <th className="pb-3 text-right text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {limits.map((item) => (
                <tr
                  key={item.plan_id}
                  className="border-b border-outline-variant/10"
                >
                  <td className="py-4 font-medium text-on-surface">
                    {PLAN_LABELS[item.plan_id] || item.plan_id}
                  </td>
                  <td className="py-4 text-on-surface-variant">
                    {formatLimitDisplay(item.monthly_limit)}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={-1}
                        value={editValues[item.plan_id] ?? ""}
                        onChange={(e) =>
                          setEditValues((prev) => ({
                            ...prev,
                            [item.plan_id]: e.target.value,
                          }))
                        }
                        className="w-24"
                      />
                      <Label className="text-xs text-on-surface-variant/50">
                        {parseInt(editValues[item.plan_id], 10) === -1
                          ? "unlimited"
                          : parseInt(editValues[item.plan_id], 10) === 0
                            ? "disabled"
                            : "per month"}
                      </Label>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <Button
                      size="sm"
                      onClick={() => handleSave(item.plan_id)}
                      disabled={
                        saving === item.plan_id ||
                        String(item.monthly_limit) === editValues[item.plan_id]
                      }
                      className="gap-1.5"
                    >
                      {saving === item.plan_id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      Save
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
