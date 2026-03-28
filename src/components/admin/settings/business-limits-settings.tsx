"use client";

import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, Loader2, Search, AlertTriangle } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

interface TenantWithLimits {
  tenant_id: string;
  business_name: string;
  subscription_plan: string;
  max_bot_messages: number;
  max_owner_chat_messages: number;
  max_owner_chat_chars: number;
  max_conversations_monthly: number | null;
}

const PLAN_CONVERSATION_DEFAULTS: Record<string, number> = {
  starter: 100,
  business: 500,
  premium: 2000,
};

export function BusinessLimitsSettings() {
  const [tenants, setTenants] = useState<TenantWithLimits[]>([]);
  const [editValues, setEditValues] = useState<
    Record<string, Partial<TenantWithLimits>>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmTenantId, setConfirmTenantId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const fetchTenants = useCallback(async () => {
    // Join tenants with tenant_limits
    const { data: tenantsData } = await supabase
      .from("tenants")
      .select("id, business_name, subscription_plan")
      .order("business_name");

    if (!tenantsData) {
      setLoading(false);
      return;
    }

    const { data: limitsData } = await supabase
      .from("tenant_limits")
      .select("*");

    const limitsMap = new Map(
      (limitsData || []).map((l: any) => [l.tenant_id, l]),
    );

    const merged: TenantWithLimits[] = tenantsData.map((t: any) => {
      const limits = limitsMap.get(t.id);
      return {
        tenant_id: t.id,
        business_name: t.business_name || "Unnamed Business",
        subscription_plan: t.subscription_plan || "starter",
        max_bot_messages: limits?.max_bot_messages ?? 20,
        max_owner_chat_messages: limits?.max_owner_chat_messages ?? 20,
        max_owner_chat_chars: limits?.max_owner_chat_chars ?? 10000,
        max_conversations_monthly: limits?.max_conversations_monthly ?? null,
      };
    });

    setTenants(merged);

    const values: Record<string, Partial<TenantWithLimits>> = {};
    for (const t of merged) {
      values[t.tenant_id] = {
        max_bot_messages: t.max_bot_messages,
        max_owner_chat_messages: t.max_owner_chat_messages,
        max_owner_chat_chars: t.max_owner_chat_chars,
        max_conversations_monthly: t.max_conversations_monthly,
      };
    }
    setEditValues(values);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  function hasChanges(tenantId: string): boolean {
    const tenant = tenants.find((t) => t.tenant_id === tenantId);
    const edit = editValues[tenantId];
    if (!tenant || !edit) return false;

    return (
      edit.max_bot_messages !== tenant.max_bot_messages ||
      edit.max_owner_chat_messages !== tenant.max_owner_chat_messages ||
      edit.max_owner_chat_chars !== tenant.max_owner_chat_chars ||
      edit.max_conversations_monthly !== tenant.max_conversations_monthly
    );
  }

  function handleSaveClick(tenantId: string) {
    setConfirmTenantId(tenantId);
  }

  async function handleConfirmSave() {
    if (!confirmTenantId) return;
    const tenantId = confirmTenantId;
    const edit = editValues[tenantId];
    if (!edit) return;

    setSaving(tenantId);
    setConfirmTenantId(null);

    const { error } = await supabase.from("tenant_limits").upsert(
      {
        tenant_id: tenantId,
        max_bot_messages: edit.max_bot_messages ?? 20,
        max_owner_chat_messages: edit.max_owner_chat_messages ?? 20,
        max_owner_chat_chars: edit.max_owner_chat_chars ?? 10000,
        max_conversations_monthly: edit.max_conversations_monthly ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id" },
    );

    if (!error) {
      setTenants((prev) =>
        prev.map((t) =>
          t.tenant_id === tenantId
            ? {
                ...t,
                max_bot_messages: edit.max_bot_messages ?? 20,
                max_owner_chat_messages: edit.max_owner_chat_messages ?? 20,
                max_owner_chat_chars: edit.max_owner_chat_chars ?? 10000,
                max_conversations_monthly:
                  edit.max_conversations_monthly ?? null,
              }
            : t,
        ),
      );
    }

    setSaving(null);
  }

  function updateField(
    tenantId: string,
    field: keyof TenantWithLimits,
    value: string,
  ) {
    const parsed = parseInt(value, 10);
    const resolved = value === "" ? null : isNaN(parsed) ? null : parsed;

    setEditValues((prev) => ({
      ...prev,
      [tenantId]: {
        ...prev[tenantId],
        [field]: resolved,
      },
    }));
  }

  const filteredTenants = tenants.filter((t) =>
    t.business_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-on-surface-variant/50" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Confirmation Dialog */}
      {confirmTenantId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-xl border border-outline-variant/20 max-w-md w-full mx-4 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-on-surface">
                  Confirm Limit Changes
                </h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  Changing limits for{" "}
                  <strong>
                    {tenants.find((t) => t.tenant_id === confirmTenantId)
                      ?.business_name || "this business"}
                  </strong>
                  . This will take effect immediately and affect the AI
                  chatbot&apos;s context window and the owner&apos;s chat
                  experience.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmTenantId(null)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirmSave}>
                Confirm Save
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 space-y-6">
        <div>
          <h3 className="font-semibold text-lg">Business Limits</h3>
          <p className="text-sm text-on-surface-variant mt-1">
            Configure per-business context window sizes, message limits, and
            monthly conversation quotas. Changes take effect immediately.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/50" />
          <Input
            placeholder="Search businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/20">
                <th className="pb-3 text-left text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Business
                </th>
                <th className="pb-3 text-left text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Plan
                </th>
                <th className="pb-3 text-center text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Bot Context
                </th>
                <th className="pb-3 text-center text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Owner Chat Context
                </th>
                <th className="pb-3 text-center text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Char Limit
                </th>
                <th className="pb-3 text-center text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Monthly Convos
                </th>
                <th className="pb-3 text-right text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((tenant) => {
                const edit = editValues[tenant.tenant_id] || {};
                const planDefault =
                  PLAN_CONVERSATION_DEFAULTS[tenant.subscription_plan] || 100;

                return (
                  <tr
                    key={tenant.tenant_id}
                    className="border-b border-outline-variant/10"
                  >
                    <td className="py-4 font-medium text-on-surface max-w-[200px] truncate">
                      {tenant.business_name}
                    </td>
                    <td className="py-4">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-surface-container-high text-on-surface-variant capitalize">
                        {tenant.subscription_plan}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          min={5}
                          max={100}
                          value={edit.max_bot_messages ?? ""}
                          onChange={(e) =>
                            updateField(
                              tenant.tenant_id,
                              "max_bot_messages",
                              e.target.value,
                            )
                          }
                          className="w-20 text-center"
                        />
                        <span className="text-[10px] text-on-surface-variant/50">
                          msgs
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          min={5}
                          max={100}
                          value={edit.max_owner_chat_messages ?? ""}
                          onChange={(e) =>
                            updateField(
                              tenant.tenant_id,
                              "max_owner_chat_messages",
                              e.target.value,
                            )
                          }
                          className="w-20 text-center"
                        />
                        <span className="text-[10px] text-on-surface-variant/50">
                          msgs
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          min={1000}
                          max={100000}
                          step={1000}
                          value={edit.max_owner_chat_chars ?? ""}
                          onChange={(e) =>
                            updateField(
                              tenant.tenant_id,
                              "max_owner_chat_chars",
                              e.target.value,
                            )
                          }
                          className="w-24 text-center"
                        />
                        <span className="text-[10px] text-on-surface-variant/50">
                          chars
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          value={
                            edit.max_conversations_monthly === null
                              ? ""
                              : (edit.max_conversations_monthly ?? "")
                          }
                          placeholder={String(planDefault)}
                          onChange={(e) =>
                            updateField(
                              tenant.tenant_id,
                              "max_conversations_monthly",
                              e.target.value,
                            )
                          }
                          className="w-20 text-center"
                        />
                        <span className="text-[10px] text-on-surface-variant/50">
                          {edit.max_conversations_monthly === null
                            ? "default"
                            : "/mo"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <Button
                        size="sm"
                        onClick={() => handleSaveClick(tenant.tenant_id)}
                        disabled={
                          saving === tenant.tenant_id ||
                          !hasChanges(tenant.tenant_id)
                        }
                        className="gap-1.5"
                      >
                        {saving === tenant.tenant_id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Save
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filteredTenants.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-on-surface-variant/50"
                  >
                    {searchQuery
                      ? "No businesses match your search"
                      : "No businesses found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="text-xs text-on-surface-variant/60 space-y-1 pt-2 border-t border-outline-variant/10">
          <p>
            <strong>Bot Context:</strong> Number of recent messages loaded as
            conversation history for the customer-facing chatbot (5-100).
          </p>
          <p>
            <strong>Owner Chat Context:</strong> Number of recent messages
            loaded for the owner&apos;s AI Chat assistant (5-100).
          </p>
          <p>
            <strong>Char Limit:</strong> Maximum character count per message in
            the owner&apos;s AI Chat (1,000-100,000).
          </p>
          <p>
            <strong>Monthly Convos:</strong> Monthly conversation quota
            override. Leave empty to use plan default.
          </p>
        </div>
      </div>
    </div>
  );
}
