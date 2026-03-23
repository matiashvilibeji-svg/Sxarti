import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

interface MonthRevenue {
  month: string;
  revenue: number;
}

interface RevenueTrendChartProps {
  data: MonthRevenue[];
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Revenue Trend</CardTitle>
            <CardDescription>
              Aggregated revenue across all business tiers.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-xs font-medium text-on-surface-variant">
              Revenue (₾)
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative flex h-64 items-end gap-3 pt-4">
          {data.map((item) => {
            const height = (item.revenue / maxRevenue) * 100;
            return (
              <div
                key={item.month}
                className="group relative flex flex-1 flex-col items-center"
              >
                <div className="relative flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-primary/70 transition-colors group-hover:bg-primary"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="mt-2 text-[10px] font-medium uppercase text-on-surface-variant">
                  {item.month}
                </span>
                <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-on-surface px-2 py-1 text-[10px] font-medium text-surface opacity-0 transition-opacity group-hover:opacity-100">
                  {item.revenue.toLocaleString()}₾
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
