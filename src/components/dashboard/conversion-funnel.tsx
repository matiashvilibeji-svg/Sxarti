"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FunnelData {
  conversations: number;
  carts: number;
  orders: number;
  confirmed: number;
}

interface ConversionFunnelProps {
  data: FunnelData;
}

const steps = [
  { key: "conversations" as const, label: "საუბრები", color: "bg-purple-500" },
  { key: "carts" as const, label: "კალათა", color: "bg-blue-500" },
  { key: "orders" as const, label: "შეკვეთა", color: "bg-cyan-500" },
  { key: "confirmed" as const, label: "დადასტურება", color: "bg-green-500" },
];

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  const max = data.conversations || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">კონვერსიის ძაბრი</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step, i) => {
            const value = data[step.key];
            const width = Math.max((value / max) * 100, 4);
            const prevValue = i > 0 ? data[steps[i - 1].key] : null;
            const rate = prevValue
              ? ((value / prevValue) * 100).toFixed(1)
              : null;

            return (
              <div key={step.key}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm text-on-surface">{step.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-on-surface">
                      {value}
                    </span>
                    {rate && (
                      <span className="text-xs text-on-surface-variant">
                        ({rate}%)
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-8 w-full rounded-md bg-surface-container-low">
                  <div
                    className={`h-full rounded-md ${step.color} transition-all duration-500`}
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
