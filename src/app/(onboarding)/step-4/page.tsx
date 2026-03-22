"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
} from "lucide-react";
import { useSupabase } from "@/hooks/use-supabase";
import { useTenant } from "@/hooks/use-tenant";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
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
  const { tenant, loading } = useTenant();
  const { toast } = useToast();

  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [zoneName, setZoneName] = useState("");
  const [fee, setFee] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
      // Insert default zones
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
    setShowForm(false);
  }

  function startEdit(zone: DeliveryZone) {
    setZoneName(zone.zone_name);
    setFee(zone.fee.toString());
    setEstimatedDays(zone.estimated_days || "");
    setEditingId(zone.id);
    setShowForm(true);
  }

  async function handleAddOrUpdate() {
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
            tenant_id: tenant!.id,
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
      <div className="space-y-4">
        <Skeleton className="mx-auto h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>მიწოდების ზონები</CardTitle>
              <CardDescription>
                განსაზღვრეთ მიწოდების არეალები და ტარიფები
              </CardDescription>
            </div>
            {!showForm && (
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="mr-1 h-4 w-4" />
                დამატება
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Add/Edit Form */}
          {showForm && (
            <div className="space-y-3 rounded-lg bg-surface-container-low p-4">
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>ტარიფი (₾)</Label>
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
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddOrUpdate}>
                  {editingId ? "განახლება" : "დამატება"}
                </Button>
                <Button size="sm" variant="ghost" onClick={resetForm}>
                  გაუქმება
                </Button>
              </div>
            </div>
          )}

          {/* Zones Table */}
          {zones.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ზონა</TableHead>
                  <TableHead>ტარიფი</TableHead>
                  <TableHead>ვადა</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">
                      {zone.zone_name}
                    </TableCell>
                    <TableCell>{formatGEL(zone.fee)}</TableCell>
                    <TableCell>{zone.estimated_days || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startEdit(zone)}
                          className="h-8 w-8"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(zone.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              ჯერ ზონები არ არის დამატებული
            </p>
          )}
        </CardContent>

        <CardFooter className="justify-between">
          <Button variant="outline" onClick={() => router.push("/step-3")}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            უკან
          </Button>
          <Button onClick={() => router.push("/step-5")}>
            შემდეგი
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
