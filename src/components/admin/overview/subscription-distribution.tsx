import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface SubscriptionDistributionProps {
  starter: number;
  business: number;
  premium: number;
}

export function SubscriptionDistribution({
  starter,
  business,
  premium,
}: SubscriptionDistributionProps) {
  const total = starter + business + premium || 1;
  const starterPct = (starter / total) * 100;
  const businessPct = (business / total) * 100;
  const premiumPct = (premium / total) * 100;

  // Conic gradient: premium -> business -> starter
  const premiumEnd = premiumPct;
  const businessEnd = premiumEnd + businessPct;

  const segments = [
    { label: "Premium", count: premium, pct: premiumPct, color: "bg-primary" },
    {
      label: "Business",
      count: business,
      pct: businessPct,
      color: "bg-secondary",
    },
    {
      label: "Starter",
      count: starter,
      pct: starterPct,
      color: "bg-surface-container-high",
    },
  ];

  return (
    <Card className="flex h-full flex-col rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Plan Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center">
        <div className="relative mb-8">
          <div
            className="h-48 w-48 rounded-full"
            style={{
              background: `conic-gradient(
                hsl(var(--primary)) 0% ${premiumEnd}%,
                hsl(var(--secondary)) ${premiumEnd}% ${businessEnd}%,
                hsl(var(--surface-container-high)) ${businessEnd}% 100%
              )`,
            }}
          >
            <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-surface-container-lowest">
              <span className="text-2xl font-bold text-on-surface">
                {total}
              </span>
              <span className="text-[10px] uppercase text-on-surface-variant">
                Total
              </span>
            </div>
          </div>
        </div>
        <div className="w-full space-y-3">
          {segments.map((seg) => (
            <div
              key={seg.label}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${seg.color}`} />
                <span className="font-medium text-on-surface">{seg.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-on-surface-variant">
                  {seg.count}
                </span>
                <span className="w-10 text-right font-mono text-sm text-on-surface-variant">
                  {seg.pct.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
