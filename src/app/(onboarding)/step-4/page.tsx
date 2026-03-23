"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Check,
  Sparkles,
  Trash2,
  Edit2,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { useSupabase } from "@/hooks/use-supabase";
import { useTenant } from "@/hooks/use-tenant";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatGEL } from "@/lib/utils/currency";
import type { DeliveryZone } from "@/types/database";

const STEPS = [
  { label: "ბიზნეს პროფილი", num: 1 },
  { label: "Facebook", num: 2 },
  { label: "პროდუქტები", num: 3 },
  { label: "მიწოდება", num: 4 },
  { label: "გადახდა", num: 5 },
];
const CURRENT_STEP = 4;

const DEFAULT_ZONES = [
  { zone_name: "თბილისი (ცენტრი)", fee: 5.0, estimated_days: "1 დღე" },
  { zone_name: "თბილისი (გარეუბანი)", fee: 8.0, estimated_days: "1-2 დღე" },
  { zone_name: "ბათუმი", fee: 12.0, estimated_days: "2-3 დღე" },
  { zone_name: "ქუთაისი", fee: 10.0, estimated_days: "2-3 დღე" },
  { zone_name: "რეგიონები", fee: 15.0, estimated_days: "3-5 დღე" },
];

const QUICK_SUGGESTIONS = [
  { zone_name: "თბილისი (ცენტრი)", fee: 5.0, estimated_days: "1 დღე" },
  { zone_name: "ბათუმი", fee: 12.0, estimated_days: "2-3 დღე" },
  { zone_name: "ქუთაისი", fee: 10.0, estimated_days: "2 დღე" },
  { zone_name: "რეგიონები", fee: 15.0, estimated_days: "3-5 დღე" },
];

const zoneSchema = z.object({
  zone_name: z.string().min(1, "ზონის სახელი სავალდებულოა"),
  fee: z
    .number({ invalid_type_error: "მიუთითეთ ფასი" })
    .positive("ფასი უნდა იყოს > 0"),
  estimated_days: z.string().min(1, "მიუთითეთ ვადა"),
});

export default function Step4Page() {
  const router = useRouter();
  const supabase = useSupabase();
  const { tenant, loading, error: tenantError } = useTenant();
  const { toast } = useToast();

  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [zoneName, setZoneName] = useState("");
  const [fee, setFee] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const activeZones = zones.filter((z) => z.is_active);

  const loadZones = useCallback(async () => {
    if (!tenant) return;
    const { data, error } = await supabase
      .from("delivery_zones")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "შეცდომა",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data && data.length === 0) {
      const inserts = DEFAULT_ZONES.map((z) => ({
        tenant_id: tenant.id,
        zone_name: z.zone_name,
        fee: z.fee,
        estimated_days: z.estimated_days,
        is_active: true,
      }));
      const { data: inserted, error: insertError } = await supabase
        .from("delivery_zones")
        .insert(inserts)
        .select();

      if (insertError) {
        toast({
          title: "შეცდომა",
          description: insertError.message,
          variant: "destructive",
        });
      } else {
        setZones((inserted as DeliveryZone[]) || []);
      }
    } else {
      setZones((data as DeliveryZone[]) || []);
    }
    setZonesLoading(false);
  }, [tenant, supabase, toast]);

  useEffect(() => {
    if (tenant) loadZones();
  }, [tenant, loadZones]);

  function resetForm() {
    setZoneName("");
    setFee("");
    setEstimatedDays("");
    setFormErrors({});
    setEditingId(null);
  }

  function startEdit(zone: DeliveryZone) {
    setZoneName(zone.zone_name);
    setFee(zone.fee.toString());
    setEstimatedDays(zone.estimated_days || "");
    setEditingId(zone.id);
  }

  async function handleAddOrUpdate() {
    if (!tenant) {
      toast({
        title: "შეცდომა",
        description: "ბიზნეს პროფილი ვერ მოიძებნა. გთხოვთ გადატვირთოთ გვერდი.",
        variant: "destructive",
      });
      return;
    }

    const parsed = zoneSchema.safeParse({
      zone_name: zoneName,
      fee: parseFloat(fee),
      estimated_days: estimatedDays,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setFormErrors(fieldErrors);
      return;
    }
    setFormErrors({});

    try {
      if (editingId) {
        const { data, error } = await supabase
          .from("delivery_zones")
          .update({
            zone_name: zoneName,
            fee: parseFloat(fee),
            estimated_days: estimatedDays,
          })
          .eq("id", editingId)
          .select()
          .single();

        if (error) throw error;
        setZones((prev) =>
          prev.map((z) => (z.id === editingId ? (data as DeliveryZone) : z)),
        );
      } else {
        const { data, error } = await supabase
          .from("delivery_zones")
          .insert({
            tenant_id: tenant.id,
            zone_name: zoneName,
            fee: parseFloat(fee),
            estimated_days: estimatedDays,
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;
        setZones((prev) => [...prev, data as DeliveryZone]);
      }
      resetForm();
    } catch (err) {
      toast({
        title: "შეცდომა",
        description:
          err instanceof Error ? err.message : "შენახვა ვერ მოხერხდა",
        variant: "destructive",
      });
    }
  }

  async function handleQuickAdd(
    suggestion: (typeof QUICK_SUGGESTIONS)[number],
  ) {
    if (!tenant) return;
    try {
      const { data, error } = await supabase
        .from("delivery_zones")
        .insert({
          tenant_id: tenant.id,
          zone_name: suggestion.zone_name,
          fee: suggestion.fee,
          estimated_days: suggestion.estimated_days,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      setZones((prev) => [...prev, data as DeliveryZone]);
      toast({
        title: "დამატებულია",
        description: `${suggestion.zone_name} წარმატებით დაემატა`,
      });
    } catch (err) {
      toast({
        title: "შეცდომა",
        description:
          err instanceof Error ? err.message : "დამატება ვერ მოხერხდა",
        variant: "destructive",
      });
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from("delivery_zones")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setZones((prev) => prev.filter((z) => z.id !== id));
    } catch (err) {
      toast({
        title: "შეცდომა",
        description: err instanceof Error ? err.message : "წაშლა ვერ მოხერხდა",
        variant: "destructive",
      });
    }
  }

  if (loading || zonesLoading) {
    return (
      <div className="space-y-4 pb-32">
        <Skeleton className="mx-auto h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (tenantError || !tenant) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-destructive">
            ბიზნეს პროფილის ჩატვირთვა ვერ მოხერხდა.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {tenantError || "პროფილი ვერ მოიძებნა"}
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            თავიდან ცდა
          </Button>
        </CardContent>
      </Card>
    );
  }

  const usedZoneNames = new Set(zones.map((z) => z.zone_name));
  const availableSuggestions = QUICK_SUGGESTIONS.filter(
    (s) => !usedZoneNames.has(s.zone_name),
  );

  return (
    <div className="space-y-6 pb-32">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => (
          <div key={step.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                  step.num < CURRENT_STEP
                    ? "border-primary bg-primary text-primary-foreground"
                    : step.num === CURRENT_STEP
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground",
                )}
              >
                {step.num < CURRENT_STEP ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.num
                )}
              </div>
              <span
                className={cn(
                  "mt-1 text-[10px]",
                  step.num === CURRENT_STEP
                    ? "font-bold text-on-surface"
                    : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-0.5 w-8 sm:w-12",
                  step.num < CURRENT_STEP
                    ? "bg-primary"
                    : "bg-muted-foreground/30",
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">
          მიტანის ზონები
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          განსაზღვრეთ სად მიაწვდით პროდუქტებს და რა ღირს მიტანა
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left Column */}
        <div className="space-y-8 lg:col-span-8">
          {/* Add Zone Form — Always Visible */}
          <section className="rounded-xl border-none bg-white p-6 shadow-[0_20px_40px_rgba(11,28,48,0.03)]">
            <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {editingId ? "ზონის რედაქტირება" : "ახალი ზონის დამატება"}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className="ml-1 text-[13px] font-semibold text-muted-foreground">
                  ზონის სახელი
                </label>
                <input
                  type="text"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  placeholder="მაგ: თბილისი (ცენტრი)"
                  className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 transition-all placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary"
                />
                {formErrors.zone_name && (
                  <p className="text-xs text-destructive">
                    {formErrors.zone_name}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="ml-1 text-[13px] font-semibold text-muted-foreground">
                  მიტანის საფასური
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 pr-8 transition-all focus:ring-2 focus:ring-primary"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">
                    ₾
                  </span>
                </div>
                {formErrors.fee && (
                  <p className="text-xs text-destructive">{formErrors.fee}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="ml-1 text-[13px] font-semibold text-muted-foreground">
                  სავარაუდო ვადა
                </label>
                <input
                  type="text"
                  value={estimatedDays}
                  onChange={(e) => setEstimatedDays(e.target.value)}
                  placeholder="მაგ: 2-3 დღე"
                  className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 transition-all placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary"
                />
                {formErrors.estimated_days && (
                  <p className="text-xs text-destructive">
                    {formErrors.estimated_days}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              {editingId && (
                <button
                  onClick={resetForm}
                  className="rounded-xl px-6 py-3 font-bold text-muted-foreground transition-all hover:bg-surface-container-low"
                >
                  გაუქმება
                </button>
              )}
              <button
                onClick={handleAddOrUpdate}
                className="rounded-xl bg-gradient-to-r from-primary to-[#7531e6] px-8 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {editingId ? "განახლება" : "დამატება"}
              </button>
            </div>
          </section>

          {/* Quick Suggestions */}
          {availableSuggestions.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-3">
                <span className="text-sm font-bold text-muted-foreground">
                  სწრაფი დამატება
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.zone_name}
                    onClick={() => handleQuickAdd(suggestion)}
                    className="rounded-full border border-transparent bg-surface-container px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-muted-foreground/20 hover:bg-surface-container-high"
                  >
                    {suggestion.zone_name} · {suggestion.fee}₾ ·{" "}
                    {suggestion.estimated_days}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Zones Table */}
          <section className="overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-muted-foreground/10 bg-surface-container-low/50 px-6 py-4">
              <span className="text-sm font-bold text-on-surface">
                არსებული ზონები
              </span>
              <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {activeZones.length} აქტიური
              </span>
            </div>
            {zones.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-muted-foreground/5">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        ზონა
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        საფასური
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        ვადა
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        მოქმედებები
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted-foreground/5">
                    {zones.map((zone) => (
                      <tr
                        key={zone.id}
                        className="group transition-colors hover:bg-surface-container-low/30"
                      >
                        <td className="px-6 py-4 text-sm font-bold text-on-surface">
                          {zone.zone_name}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-muted-foreground">
                          {formatGEL(zone.fee)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-muted-foreground">
                          {zone.estimated_days || "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => startEdit(zone)}
                              className="rounded-lg p-2 text-primary transition-colors hover:bg-surface-container-high"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(zone.id)}
                              className="rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                ჯერ ზონები არ არის დამატებული
              </p>
            )}
          </section>
        </div>

        {/* Right Sidebar */}
        <aside className="sticky top-24 lg:col-span-4">
          {/* AI Tip Card */}
          <div className="rounded-xl border-l-4 border-[#7531e6] bg-purple-50/60 p-6 shadow-sm backdrop-blur-md">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#7531e6]" />
              <h4 className="font-bold text-purple-900">ჭკვიანი რჩევა</h4>
            </div>
            <p className="text-sm leading-relaxed text-purple-800/80">
              მომხმარებლების 70% უპირატესობას ანიჭებს უფასო მიტანას. განიხილეთ
              &ldquo;უფასო მიტანა 100₾-დან&rdquo; აქციის დამატება კონვერტაციის
              გასაზრდელად.
            </p>
          </div>

          {/* Logistics Map Placeholder */}
          <div className="mt-6 space-y-4 rounded-xl bg-white p-6 shadow-sm">
            <h4 className="text-sm font-bold text-on-surface">
              ლოგისტიკის რუკა
            </h4>
            <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-container">
              <div className="flex h-full w-full items-center justify-center">
                <MapPin className="h-16 w-16 text-muted-foreground/20" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-white shadow-lg">
                  აქტიური ზონები
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Fixed Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 z-50 w-full border-t border-muted-foreground/10 bg-white/80 px-6 py-6 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <button
            onClick={() => router.push("/step-3")}
            className="flex items-center gap-2 rounded-lg px-4 py-2 font-bold text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            უკან
          </button>

          <div className="hidden flex-col items-center gap-1 md:flex">
            <p className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground/70">
              შემდეგი ნაბიჯი
            </p>
            <p className="text-xs text-muted-foreground">გადახდის დეტალები</p>
          </div>

          <div className="flex items-center gap-6">
            <span
              className={cn(
                "hidden items-center gap-1.5 text-xs font-semibold sm:inline-flex",
                zones.length > 0 ? "text-emerald-600" : "text-muted-foreground",
              )}
            >
              {zones.length > 0 && <Check className="h-3.5 w-3.5" />}
              მინიმუმ 1 ზონა აუცილებელია
            </span>
            <button
              onClick={() => router.push("/step-5")}
              disabled={zones.length === 0}
              className={cn(
                "rounded-xl px-10 py-3 font-bold shadow-xl transition-all",
                zones.length > 0
                  ? "bg-gradient-to-r from-primary to-[#7531e6] text-white shadow-primary/20 hover:scale-105 active:scale-95"
                  : "cursor-not-allowed bg-muted text-muted-foreground shadow-none",
              )}
            >
              გაგრძელება
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
