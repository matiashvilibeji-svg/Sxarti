"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const periods = [
  { value: "7d", label: "7 დღე" },
  { value: "30d", label: "30 დღე" },
  { value: "90d", label: "90 დღე" },
] as const;

interface TimePeriodSelectorProps {
  value: string;
  onChange: (period: string) => void;
}

export function TimePeriodSelector({
  value,
  onChange,
}: TimePeriodSelectorProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-surface-container-low p-1">
      {periods.map((period) => (
        <Button
          key={period.value}
          variant={value === period.value ? "default" : "ghost"}
          size="sm"
          className={cn(
            "text-xs",
            value !== period.value && "text-on-surface-variant",
          )}
          onClick={() => onChange(period.value)}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
}
