"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Plan = "starter" | "business" | "premium";

interface ChangePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  businessName: string;
  currentPlan: Plan;
  onSuccess: () => void;
}

const PLANS: { value: Plan; label: string; price: number }[] = [
  { value: "starter", label: "Starter", price: 49 },
  { value: "business", label: "Business", price: 149 },
  { value: "premium", label: "Premium", price: 299 },
];

const planStyles: Record<Plan, string> = {
  starter:
    "border-outline-variant bg-surface-container-high/30 text-on-surface-variant",
  business: "border-secondary bg-secondary/5 text-secondary",
  premium: "border-primary bg-primary/5 text-primary",
};

const planActiveStyles: Record<Plan, string> = {
  starter:
    "ring-2 ring-outline-variant border-outline-variant bg-surface-container-high/50",
  business: "ring-2 ring-secondary border-secondary bg-secondary/10",
  premium: "ring-2 ring-primary border-primary bg-primary/10",
};

export function ChangePlanModal({
  open,
  onOpenChange,
  tenantId,
  businessName,
  currentPlan,
  onSuccess,
}: ChangePlanModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan>(currentPlan);
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (selectedPlan === currentPlan) return;
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("tenants")
        .update({ subscription_plan: selectedPlan })
        .eq("id", tenantId);

      if (error) throw error;

      onSuccess();
      onOpenChange(false);
    } catch {
      // Error handled silently — toast can be added later
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Subscription Plan</DialogTitle>
          <DialogDescription>
            Update the plan for <strong>{businessName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Select Plan
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PLANS.map((plan) => (
                <button
                  key={plan.value}
                  onClick={() => setSelectedPlan(plan.value)}
                  className={cn(
                    "p-3 rounded-lg border text-center transition-all",
                    selectedPlan === plan.value
                      ? planActiveStyles[plan.value]
                      : planStyles[plan.value],
                    plan.value === currentPlan &&
                      selectedPlan !== plan.value &&
                      "opacity-50",
                  )}
                >
                  <span className="text-xs font-bold uppercase block">
                    {plan.label}
                  </span>
                  <span className="text-sm font-mono font-semibold block mt-1">
                    {plan.price}₾
                  </span>
                  {plan.value === currentPlan && (
                    <span className="text-[9px] text-on-surface-variant block mt-0.5">
                      Current
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Effective Date
            </label>
            <Input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Reason for Change
            </label>
            <Textarea
              placeholder="Why is this plan being changed?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || selectedPlan === currentPlan}
          >
            {loading ? "Updating..." : "Confirm Change"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
