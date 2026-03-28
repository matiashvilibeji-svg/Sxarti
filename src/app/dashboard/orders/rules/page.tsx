"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Zap,
  Plus,
  Pencil,
  Trash2,
  Sheet,
  MessageCircle,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Loading } from "@/components/shared/loading";
import { useSupabase } from "@/hooks/use-supabase";
import { useTenant } from "@/hooks/use-tenant";
import { cn } from "@/lib/utils";
import type {
  OrderRule,
  OrderRuleTrigger,
  OrderRuleAction,
  OrderRuleConfig,
} from "@/types/database";

const triggerLabels: Record<
  OrderRuleTrigger,
  { label: string; className: string }
> = {
  order_created: {
    label: "შეკვეთა შეიქმნა",
    className: "bg-blue-100 text-blue-700",
  },
  payment_confirmed: {
    label: "გადახდა დადასტურდა",
    className: "bg-green-100 text-green-700",
  },
  order_shipped: {
    label: "შეკვეთა გაიგზავნა",
    className: "bg-purple-100 text-purple-700",
  },
  order_delivered: {
    label: "შეკვეთა მიწოდებულია",
    className: "bg-emerald-100 text-emerald-700",
  },
};

const actionLabels: Record<
  OrderRuleAction,
  { label: string; icon: typeof Sheet; description: string }
> = {
  google_sheet_sync: {
    label: "Google Sheets-ში დამატება",
    icon: Sheet,
    description: "შეკვეთის მონაცემები ავტომატურად დაემატება Google Sheet-ში",
  },
  message_customer: {
    label: "მომხმარებლის შეტყობინება",
    icon: MessageCircle,
    description: "მომხმარებელს გაეგზავნება შეტყობინება",
  },
  notify_owner: {
    label: "მფლობელის შეტყობინება",
    icon: Bell,
    description: "თქვენ მიიღებთ შეტყობინებას WhatsApp/Telegram-ით",
  },
};

const placeholderHints = [
  "{order_number} — შეკვეთის ნომერი",
  "{customer_name} — მომხმარებლის სახელი",
  "{customer_phone} — ტელეფონი",
  "{total} — ჯამი",
  "{items_count} — ნივთების რაოდენობა",
];

interface RuleFormState {
  name: string;
  trigger_event: OrderRuleTrigger;
  action_type: OrderRuleAction;
  action_config: OrderRuleConfig;
}

const defaultForm: RuleFormState = {
  name: "",
  trigger_event: "order_created",
  action_type: "google_sheet_sync",
  action_config: {},
};

export default function OrderRulesPage() {
  const supabase = useSupabase();
  const { tenant, loading: tenantLoading } = useTenant();

  const [rules, setRules] = useState<OrderRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<OrderRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrderRule | null>(null);
  const [form, setForm] = useState<RuleFormState>(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchRules = useCallback(async () => {
    if (!tenant) return;
    setLoading(true);
    const { data } = await supabase
      .from("order_rules")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false });
    setRules((data as OrderRule[]) ?? []);
    setLoading(false);
  }, [supabase, tenant]);

  useEffect(() => {
    if (tenant) fetchRules();
  }, [tenant, fetchRules]);

  const openCreate = () => {
    setEditingRule(null);
    setForm(defaultForm);
    setFormOpen(true);
  };

  const openEdit = (rule: OrderRule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      trigger_event: rule.trigger_event,
      action_type: rule.action_type,
      action_config: rule.action_config,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!tenant || !form.name.trim()) return;
    setSaving(true);

    const payload = {
      tenant_id: tenant.id,
      name: form.name.trim(),
      trigger_event: form.trigger_event,
      action_type: form.action_type,
      action_config: form.action_config,
    };

    if (editingRule) {
      await supabase
        .from("order_rules")
        .update(payload)
        .eq("id", editingRule.id);
    } else {
      await supabase.from("order_rules").insert(payload);
    }

    setSaving(false);
    setFormOpen(false);
    setEditingRule(null);
    fetchRules();
  };

  const handleToggle = async (rule: OrderRule) => {
    await supabase
      .from("order_rules")
      .update({ is_active: !rule.is_active })
      .eq("id", rule.id);
    setRules((prev) =>
      prev.map((r) =>
        r.id === rule.id ? { ...r, is_active: !r.is_active } : r,
      ),
    );
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from("order_rules").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    fetchRules();
  };

  if (tenantLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-display text-on-surface">
            ავტომატიზაცია
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            შეკვეთის სტატუსის ცვლილებისას ავტომატური მოქმედებები
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          წესის დამატება
        </Button>
      </div>

      {loading ? (
        <Loading />
      ) : rules.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="წესები ჯერ არ არის"
          description="შექმენით ავტომატიზაციის წესი, რომ შეკვეთის სტატუსის ცვლილებისას მოხდეს ავტომატური მოქმედება"
          actionLabel="წესის შექმნა"
          onAction={openCreate}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rules.map((rule) => {
            const trigger = triggerLabels[rule.trigger_event];
            const action = actionLabels[rule.action_type];
            const ActionIcon = action.icon;
            return (
              <div
                key={rule.id}
                className={cn(
                  "rounded-xl border bg-surface-container-low p-5 transition-shadow hover:shadow-md",
                  rule.is_active
                    ? "border-outline-variant"
                    : "border-outline-variant/50 opacity-60",
                )}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-on-surface truncate">
                      {rule.name}
                    </h3>
                    <Badge className={cn("mt-1", trigger.className)}>
                      {trigger.label}
                    </Badge>
                  </div>
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={() => handleToggle(rule)}
                  />
                </div>

                <div className="mb-4 flex items-center gap-2 rounded-lg bg-surface-container p-3">
                  <ActionIcon className="h-4 w-4 flex-shrink-0 text-on-surface-variant" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface">
                      {action.label}
                    </p>
                    {rule.action_type === "message_customer" &&
                      rule.action_config.template && (
                        <p className="mt-0.5 text-xs text-on-surface-variant truncate">
                          {rule.action_config.template}
                        </p>
                      )}
                    {rule.action_type === "notify_owner" &&
                      rule.action_config.message && (
                        <p className="mt-0.5 text-xs text-on-surface-variant truncate">
                          {rule.action_config.message}
                        </p>
                      )}
                    {rule.action_type === "google_sheet_sync" &&
                      rule.action_config.sheet_id && (
                        <p className="mt-0.5 text-xs text-on-surface-variant truncate">
                          Sheet: {rule.action_config.sheet_id}
                        </p>
                      )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEdit(rule)}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    რედაქტირება
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(rule)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingRule(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "წესის რედაქტირება" : "ახალი წესი"}
            </DialogTitle>
            <DialogDescription>
              განსაზღვრეთ რა მოხდეს შეკვეთის სტატუსის ცვლილებისას
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rule-name">სახელი</Label>
              <Input
                id="rule-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="მაგ: Google Sheets-ში ჩაწერა"
              />
            </div>

            <div>
              <Label>ტრიგერი</Label>
              <Select
                value={form.trigger_event}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    trigger_event: v as OrderRuleTrigger,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(triggerLabels).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>მოქმედება</Label>
              <Select
                value={form.action_type}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    action_type: v as OrderRuleAction,
                    action_config: {},
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(actionLabels).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-on-surface-variant">
                {actionLabels[form.action_type].description}
              </p>
            </div>

            {/* Dynamic config based on action type */}
            {form.action_type === "google_sheet_sync" && (
              <div>
                <Label htmlFor="sheet-id">
                  Google Sheet ID (არასავალდებულო)
                </Label>
                <Input
                  id="sheet-id"
                  value={form.action_config.sheet_id ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      action_config: {
                        ...f.action_config,
                        sheet_id: e.target.value || undefined,
                      },
                    }))
                  }
                  placeholder="ნაგულისხმევად გამოიყენება პარამეტრებში მითითებული Sheet"
                />
              </div>
            )}

            {form.action_type === "message_customer" && (
              <div>
                <Label htmlFor="template">შეტყობინების შაბლონი</Label>
                <Textarea
                  id="template"
                  value={form.action_config.template ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      action_config: {
                        ...f.action_config,
                        template: e.target.value,
                      },
                    }))
                  }
                  placeholder="მაგ: გამარჯობა {customer_name}! თქვენი შეკვეთა {order_number} მიწოდებულია."
                  rows={3}
                />
                <div className="mt-2 space-y-0.5">
                  <p className="text-xs font-medium text-on-surface-variant">
                    ხელმისაწვდომი ცვლადები:
                  </p>
                  {placeholderHints.map((hint) => (
                    <p key={hint} className="text-xs text-on-surface-variant">
                      {hint}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {form.action_type === "notify_owner" && (
              <div>
                <Label htmlFor="owner-message">შეტყობინების ტექსტი</Label>
                <Textarea
                  id="owner-message"
                  value={form.action_config.message ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      action_config: {
                        ...f.action_config,
                        message: e.target.value,
                      },
                    }))
                  }
                  placeholder="მაგ: შეკვეთა {order_number} - {customer_name} - {total}₾"
                  rows={3}
                />
                <div className="mt-2 space-y-0.5">
                  <p className="text-xs font-medium text-on-surface-variant">
                    ხელმისაწვდომი ცვლადები:
                  </p>
                  {placeholderHints.map((hint) => (
                    <p key={hint} className="text-xs text-on-surface-variant">
                      {hint}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFormOpen(false);
                setEditingRule(null);
              }}
            >
              გაუქმება
            </Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || saving}>
              {saving ? "ინახება..." : editingRule ? "შენახვა" : "შექმნა"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>წესის წაშლა</DialogTitle>
            <DialogDescription>
              ნამდვილად გსურთ &quot;{deleteTarget?.name}&quot; წაშლა?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              გაუქმება
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              წაშლა
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
