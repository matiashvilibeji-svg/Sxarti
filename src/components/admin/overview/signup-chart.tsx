import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

interface WeekSignup {
  week: string;
  count: number;
}

interface SignupChartProps {
  data: WeekSignup[];
}

export function SignupChart({ data }: SignupChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <Card className="flex h-full flex-col rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Recent Sign-ups</CardTitle>
        <CardDescription>New tenant registrations by week.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="flex flex-1 items-end gap-2">
          {data.map((item) => {
            const height = (item.count / maxCount) * 100;
            return (
              <div
                key={item.week}
                className="group flex flex-1 flex-col items-center"
              >
                <div className="relative flex h-40 w-full items-end">
                  <div
                    className="w-full rounded-t bg-secondary/60 transition-colors group-hover:bg-secondary"
                    style={{ height: `${height}%` }}
                  />
                  <div className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-on-surface opacity-0 transition-opacity group-hover:opacity-100">
                    {item.count}
                  </div>
                </div>
                <span className="mt-2 text-[10px] text-on-surface-variant">
                  {item.week}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
