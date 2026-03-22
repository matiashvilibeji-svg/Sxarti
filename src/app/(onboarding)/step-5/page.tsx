"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Check, ChevronLeft, Shield } from "lucide-react";
import { useSupabase } from "@/hooks/use-supabase";
import { useTenant } from "@/hooks/use-tenant";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "ბიზნეს პროფილი", num: 1 },
  { label: "Facebook", num: 2 },
  { label: "პროდუქტები", num: 3 },
  { label: "მიწოდება", num: 4 },
  { label: "გადახდა", num: 5 },
];
const CURRENT_STEP = 5;

type Bank = "bog" | "tbc";

const schema = z.object({
  bank: z.enum(["bog", "tbc"], { required_error: "აირჩიეთ ბანკი" }),
  iban: z.string().min(1, "ანგარიშის ნომერი სავალდებულოა"),
});

export default function Step5Page() {
  const router = useRouter();
  const supabase = useSupabase();
  const { tenant, loading } = useTenant();
  const { toast } = useToast();

  const [bank, setBank] = useState<Bank | null>(null);
  const [iban, setIban] = useState("");
  const [instructions, setInstructions] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (tenant?.payment_details) {
      const pd = tenant.payment_details;
      if (pd.bog_iban) {
        setBank("bog");
        setIban(pd.bog_iban);
      } else if (pd.tbc_account) {
        setBank("tbc");
        setIban(pd.tbc_account);
      }
      if (pd.instructions) setInstructions(pd.instructions);
    }
  }, [tenant]);

  async function handleSubmit() {
    const result = schema.safeParse({ bank, iban });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);

    try {
      const paymentDetails: Record<string, string> = {};
      if (bank === "bog") paymentDetails.bog_iban = iban;
      else paymentDetails.tbc_account = iban;
      if (instructions) paymentDetails.instructions = instructions;

      const { error: updateError } = await supabase
        .from("tenants")
        .update({ payment_details: paymentDetails })
        .eq("id", tenant!.id);

      if (updateError) throw updateError;

      router.push("/complete");
    } catch (err) {
      toast({
        title: "შეცდომა",
        description:
          err instanceof Error ? err.message : "შენახვა ვერ მოხერხდა",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
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
          <CardTitle>გადახდის დეტალები</CardTitle>
          <CardDescription>
            მიუთითეთ საბანკო ანგარიში შეკვეთების მისაღებად
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Bank Selection */}
          <div className="space-y-2">
            <Label>ბანკი</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBank("bog")}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-lg p-5 transition-all",
                  bank === "bog"
                    ? "bg-primary/10 ring-2 ring-primary"
                    : "ghost-border hover:bg-surface-container-low",
                )}
              >
                {bank === "bog" && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <span className="text-2xl font-bold text-on-surface">BoG</span>
                <span className="text-xs text-on-surface-variant">
                  საქართველოს ბანკი
                </span>
              </button>

              <button
                type="button"
                onClick={() => setBank("tbc")}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-lg p-5 transition-all",
                  bank === "tbc"
                    ? "bg-primary/10 ring-2 ring-primary"
                    : "ghost-border hover:bg-surface-container-low",
                )}
              >
                {bank === "tbc" && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <span className="text-2xl font-bold text-on-surface">TBC</span>
                <span className="text-xs text-on-surface-variant">
                  თიბისი ბანკი
                </span>
              </button>
            </div>
            {errors.bank && (
              <p className="text-xs text-destructive">{errors.bank}</p>
            )}
          </div>

          {/* IBAN */}
          <div className="space-y-2">
            <Label htmlFor="iban">IBAN / ანგარიშის ნომერი</Label>
            <Input
              id="iban"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="GE00TB..."
            />
            {errors.iban && (
              <p className="text-xs text-destructive">{errors.iban}</p>
            )}
          </div>

          {/* Additional Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">დამატებითი ინსტრუქციები</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="მაგ: გადახდის დადასტურების შემდეგ გაიგზავნება..."
            />
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 rounded-lg bg-surface-container-low p-4">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm text-on-surface-variant">
              თქვენი საბანკო მონაცემები დაშიფრულია და უსაფრთხოდ ინახება. მხოლოდ
              შეკვეთის გადახდის ინსტრუქციებში გამოიყენება.
            </p>
          </div>
        </CardContent>

        <CardFooter className="justify-between">
          <Button variant="outline" onClick={() => router.push("/step-4")}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            უკან
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "ინახება..." : "დასრულება"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
