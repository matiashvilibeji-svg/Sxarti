"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Building2,
  Waves,
  Mountain,
  Map,
  Sparkles,
} from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loading } from "@/components/shared/loading";
import { useSupabase } from "@/hooks/use-supabase";
import { useTenant } from "@/hooks/use-tenant";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { DeliveryZone } from "@/types/database";

const ZONE_ICONS: Record<string, typeof MapPin> = {
  "თბილისი (ცენტრი)": MapPin,
  "თბილისი (გარეუბანი)": Building2,
  ბათუმი: Waves,
  ქუთაისი: Mountain,
  რეგიონები: Map,
};

const zoneSchema = z.object({
  zone_name: z.string().min(1, "ზონის სახელი სავალდებულოა"),
  fee: z
    .number({ invalid_type_error: "მიუთითეთ ფასი" })
    .nonnegative("ფასი არ შეიძლება იყოს უარყოფითი"),
  estimated_days: z.string().min(1, "მიუთითეთ ვადა"),
});

export default function DeliveryZonesPage() {
  const supabase = useSupabase();
  const { tenant, loading: tenantLoading } = useTenant();
  const { toast } = useToast();

  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryZone | null>(null);

  // Form state
  const [zoneName, setZoneName] = useState("");
  const [fee, setFee] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchZones = useCallback(async () => {
    if (!tenant) return;
    setLoading(true);
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
    }
    setZones((data as DeliveryZone[]) ?? []);
    setLoading(false);
  }, [supabase, tenant, toast]);

  useEffect(() => {
    if (tenant) fetchZones();
  }, [tenant, fetchZones]);

  function resetForm() {
    setZoneName("");
    setFee("");
    setEstimatedDays("");
    setFormErrors({});
    setEditingZone(null);
  }

  function openAddForm() {
    resetForm();
    setFormOpen(true);
  }

  function openEditForm(zone: DeliveryZone) {
    setZoneName(zone.zone_name);
    setFee(zone.fee.toString());
    setEstimatedDays(zone.estimated_days || "");
    setEditingZone(zone);
    setFormOpen(true);
  }

  async function handleSave() {
    if (!tenant) return;

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
      if (editingZone) {
        const { error } = await supabase
          .from("delivery_zones")
          .update({
            zone_name: zoneName,
            fee: parseFloat(fee),
            estimated_days: estimatedDays,
          })
          .eq("id", editingZone.id);

        if (error) throw error;
        toast({
          title: "განახლებულია",
          description: `${zoneName} წარმატებით განახლდა`,
        });
      } else {
        const { error } = await supabase.from("delivery_zones").insert({
          tenant_id: tenant.id,
          zone_name: zoneName,
          fee: parseFloat(fee),
          estimated_days: estimatedDays,
          is_active: true,
        });

        if (error) throw error;
        toast({
          title: "დამატებულია",
          description: `${zoneName} წარმატებით დაემატა`,
        });
      }
      setFormOpen(false);
      resetForm();
      fetchZones();
    } catch (err) {
      toast({
        title: "შეცდომა",
        description:
          err instanceof Error ? err.message : "შენახვა ვერ მოხერხდა",
        variant: "destructive",
      });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase
        .from("delivery_zones")
        .delete()
        .eq("id", deleteTarget.id);

      if (error) throw error;
      toast({
        title: "წაშლილია",
        description: `${deleteTarget.zone_name} წაიშალა`,
      });
      setDeleteTarget(null);
      fetchZones();
    } catch (err) {
      toast({
        title: "შეცდომა",
        description: err instanceof Error ? err.message : "წაშლა ვერ მოხერხდა",
        variant: "destructive",
      });
    }
  }

  function getZoneIcon(name: string) {
    const Icon = ZONE_ICONS[name] || MapPin;
    return Icon;
  }

  if (tenantLoading || loading) return <Loading />;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">
            მიტანის ზონები
          </h1>
          <p className="mt-1 text-on-surface-variant">
            განსაზღვრეთ სად და რა პირობებით მიაწვდით თქვენს პროდუქტს
            მომხმარებელს.
          </p>
        </div>
        <Button onClick={openAddForm} className="gap-2">
          <Plus className="h-4 w-4" />
          დაამატე ზონა
        </Button>
      </div>

      {/* Zone Cards */}
      <div className="overflow-hidden rounded-xl bg-white shadow-[0_20px_40px_rgba(11,28,48,0.03)]">
        {/* Column Header */}
        <div className="grid grid-cols-12 px-6 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
          <div className="col-span-5">ზონის დასახელება</div>
          <div className="col-span-3 text-center">ფასი (₾)</div>
          <div className="col-span-3 text-center">ვადა (დღე)</div>
          <div className="col-span-1" />
        </div>

        {/* Zone List */}
        {zones.length > 0 ? (
          <div className="space-y-0">
            {zones.map((zone, i) => {
              const Icon = getZoneIcon(zone.zone_name);
              const isEven = i % 2 === 0;

              return (
                <div
                  key={zone.id}
                  className={cn(
                    "grid grid-cols-12 items-center px-6 py-5 transition-colors",
                    isEven
                      ? "bg-surface-container-low"
                      : "border border-transparent bg-white",
                  )}
                >
                  <div className="col-span-5 flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        isEven
                          ? "bg-primary text-white"
                          : "bg-surface-container text-primary",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-on-surface">
                      {zone.zone_name}
                    </span>
                  </div>
                  <div className="col-span-3 text-center font-semibold text-primary">
                    {Number(zone.fee).toFixed(2)} ₾
                  </div>
                  <div className="col-span-3 text-center text-on-surface-variant">
                    {zone.estimated_days || "—"}
                  </div>
                  <div className="col-span-1 flex justify-end gap-1">
                    <button
                      onClick={() => openEditForm(zone)}
                      className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(zone)}
                      className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center">
            <MapPin className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              ჯერ ზონები არ არის დამატებული
            </p>
            <Button variant="outline" className="mt-4" onClick={openAddForm}>
              <Plus className="mr-2 h-4 w-4" />
              პირველი ზონის დამატება
            </Button>
          </div>
        )}
      </div>

      {/* AI Recommendation Card */}
      <div className="flex items-start gap-4 rounded-xl border-l-4 border-[#7531e6] bg-purple-50/60 p-6 backdrop-blur-md">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#7531e6]" />
        <div>
          <h4 className="mb-1 font-bold text-purple-900">AI რეკომენდაცია</h4>
          <p className="text-sm text-purple-800/80">
            თქვენს ინდუსტრიაში თბილისის ცენტრში 5₾ მიტანა ზრდის კონვერსიას
            15%-ით. რეკომენდებულია 200₾-ზე მეტ შეკვეთაზე უფასო მიტანის დამატება.
          </p>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingZone ? "ზონის რედაქტირება" : "ახალი ზონის დამატება"}
            </DialogTitle>
            <DialogDescription>
              შეავსეთ მიტანის ზონის დეტალები
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>ზონის სახელი</Label>
              <Input
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="მაგ: თბილისი (ცენტრი)"
              />
              {formErrors.zone_name && (
                <p className="text-xs text-destructive">
                  {formErrors.zone_name}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>მიტანის საფასური (₾)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  placeholder="0.00"
                />
                {formErrors.fee && (
                  <p className="text-xs text-destructive">{formErrors.fee}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>სავარაუდო ვადა</Label>
                <Input
                  value={estimatedDays}
                  onChange={(e) => setEstimatedDays(e.target.value)}
                  placeholder="მაგ: 1-2 დღე"
                />
                {formErrors.estimated_days && (
                  <p className="text-xs text-destructive">
                    {formErrors.estimated_days}
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              გაუქმება
            </Button>
            <Button onClick={handleSave}>
              {editingZone ? "განახლება" : "დამატება"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ზონის წაშლა</DialogTitle>
            <DialogDescription>
              დარწმუნებული ხართ რომ გსურთ &ldquo;{deleteTarget?.zone_name}
              &rdquo; ზონის წაშლა? ეს მოქმედება შეუქცევადია.
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
