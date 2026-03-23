"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface PricingPlan {
  name: string;
  price: string;
  features: string[];
  ctaText: string;
  highlighted: boolean;
}

interface PricingBlockData {
  plans: PricingPlan[];
}

interface PricingBlockProps {
  data: PricingBlockData;
  onChange: (data: PricingBlockData) => void;
}

export const pricingBlockDefaults: PricingBlockData = {
  plans: [
    {
      name: "Starter",
      price: "49",
      features: ["1 AI ბოტი", "500 შეტყობინება/თვე", "ბაზისური ანალიტიკა"],
      ctaText: "დაიწყე უფასოდ",
      highlighted: false,
    },
    {
      name: "Business",
      price: "149",
      features: [
        "5 AI ბოტი",
        "5000 შეტყობინება/თვე",
        "გაფართოებული ანალიტიკა",
        "პრიორიტეტული მხარდაჭერა",
      ],
      ctaText: "აირჩიე Business",
      highlighted: true,
    },
    {
      name: "Premium",
      price: "299",
      features: [
        "უსაზღვრო ბოტები",
        "უსაზღვრო შეტყობინებები",
        "სრული ანალიტიკა",
        "24/7 მხარდაჭერა",
        "API წვდომა",
      ],
      ctaText: "აირჩიე Premium",
      highlighted: false,
    },
  ],
};

export function PricingBlock({ data, onChange }: PricingBlockProps) {
  const [expandedPlan, setExpandedPlan] = useState<number | null>(0);

  const updatePlan = (
    index: number,
    field: keyof Omit<PricingPlan, "features">,
    value: string | boolean,
  ) => {
    const newPlans = [...data.plans];
    newPlans[index] = { ...newPlans[index], [field]: value };
    onChange({ ...data, plans: newPlans });
  };

  const updateFeature = (
    planIndex: number,
    featureIndex: number,
    value: string,
  ) => {
    const newPlans = [...data.plans];
    const newFeatures = [...newPlans[planIndex].features];
    newFeatures[featureIndex] = value;
    newPlans[planIndex] = { ...newPlans[planIndex], features: newFeatures };
    onChange({ ...data, plans: newPlans });
  };

  const addFeature = (planIndex: number) => {
    const newPlans = [...data.plans];
    newPlans[planIndex] = {
      ...newPlans[planIndex],
      features: [...newPlans[planIndex].features, ""],
    };
    onChange({ ...data, plans: newPlans });
  };

  const removeFeature = (planIndex: number, featureIndex: number) => {
    const newPlans = [...data.plans];
    newPlans[planIndex] = {
      ...newPlans[planIndex],
      features: newPlans[planIndex].features.filter(
        (_, i) => i !== featureIndex,
      ),
    };
    onChange({ ...data, plans: newPlans });
  };

  return (
    <div className="space-y-4">
      {data.plans.map((plan, planIndex) => {
        const isExpanded = expandedPlan === planIndex;

        return (
          <div
            key={planIndex}
            className={`rounded-2xl bg-surface-container-lowest shadow-ambient-sm overflow-hidden ${
              plan.highlighted
                ? "border border-primary/20"
                : "border border-surface-container-high"
            }`}
          >
            <button
              type="button"
              onClick={() => setExpandedPlan(isExpanded ? null : planIndex)}
              className={`w-full px-6 py-5 flex items-center justify-between text-left transition-colors ${
                plan.highlighted
                  ? "bg-primary/[0.03]"
                  : "hover:bg-surface-container-low"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    plan.highlighted
                      ? "bg-primary/10 text-primary"
                      : "bg-surface-container-low text-on-surface-variant"
                  }`}
                >
                  <span className="text-lg font-bold">₾</span>
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">{plan.name}</h3>
                  <p className="text-xs text-on-surface-variant">
                    ₾{plan.price}/თვე
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {plan.highlighted && (
                  <span className="text-[10px] font-bold uppercase text-primary">
                    Popular
                  </span>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-on-surface-variant" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-on-surface-variant" />
                )}
              </div>
            </button>

            {isExpanded && (
              <div className="p-6 space-y-6 border-t border-surface-container-high">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Plan Display Name
                    </Label>
                    <Input
                      value={plan.name}
                      onChange={(e) =>
                        updatePlan(planIndex, "name", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      CTA Button Text
                    </Label>
                    <Input
                      value={plan.ctaText}
                      onChange={(e) =>
                        updatePlan(planIndex, "ctaText", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Monthly Price (₾)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-mono">
                        ₾
                      </span>
                      <Input
                        value={plan.price}
                        onChange={(e) =>
                          updatePlan(planIndex, "price", e.target.value)
                        }
                        className="pl-8 font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Highlight as Popular
                    </Label>
                    <label className="flex items-center gap-3 h-10 cursor-pointer">
                      <div
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          plan.highlighted
                            ? "bg-primary"
                            : "bg-surface-container-highest"
                        }`}
                        onClick={() =>
                          updatePlan(
                            planIndex,
                            "highlighted",
                            !plan.highlighted,
                          )
                        }
                      >
                        <div
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                            plan.highlighted
                              ? "translate-x-5"
                              : "translate-x-0.5"
                          }`}
                        />
                      </div>
                      <span className="text-sm text-on-surface-variant">
                        {plan.highlighted ? "Yes" : "No"}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Feature List
                  </Label>
                  <div className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="flex items-center gap-2"
                      >
                        <Input
                          value={feature}
                          onChange={(e) =>
                            updateFeature(
                              planIndex,
                              featureIndex,
                              e.target.value,
                            )
                          }
                          placeholder="Feature description..."
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFeature(planIndex, featureIndex)}
                          className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addFeature(planIndex)}
                      className="flex items-center gap-2 text-primary font-bold text-xs mt-2 px-1 hover:opacity-80 transition-opacity"
                    >
                      <Plus className="h-4 w-4" />
                      Add New Feature
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
