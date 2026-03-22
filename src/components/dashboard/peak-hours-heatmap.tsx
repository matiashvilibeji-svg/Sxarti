"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HeatmapData {
  hour: number;
  day: number;
  count: number;
}

interface PeakHoursHeatmapProps {
  data: HeatmapData[];
}

const dayLabels = ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვ"];

function getIntensity(count: number, max: number): string {
  if (max === 0 || count === 0) return "bg-surface-container-low";
  const ratio = count / max;
  if (ratio > 0.75) return "bg-primary/80";
  if (ratio > 0.5) return "bg-primary/50";
  if (ratio > 0.25) return "bg-primary/30";
  return "bg-primary/10";
}

export function PeakHoursHeatmap({ data }: PeakHoursHeatmapProps) {
  const max = Math.max(...data.map((d) => d.count), 0);

  const grid = Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) => {
      const cell = data.find((d) => d.day === day && d.hour === hour);
      return cell?.count ?? 0;
    }),
  );

  // Show a subset of hour labels for readability
  const hourLabels = Array.from({ length: 24 }, (_, i) => i);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">პიკის საათები</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-on-surface-variant">
            მონაცემები ჯერ არ არის
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              {/* Hour labels */}
              <div className="mb-1 flex">
                <div className="w-10 shrink-0" />
                {hourLabels.map((h) => (
                  <div
                    key={h}
                    className="flex-1 text-center text-[10px] text-on-surface-variant"
                  >
                    {h % 3 === 0 ? `${h}` : ""}
                  </div>
                ))}
              </div>
              {/* Grid rows */}
              {grid.map((row, dayIdx) => (
                <div key={dayIdx} className="flex items-center gap-0.5 mb-0.5">
                  <div className="w-10 shrink-0 text-xs text-on-surface-variant">
                    {dayLabels[dayIdx]}
                  </div>
                  {row.map((count, hourIdx) => (
                    <div
                      key={hourIdx}
                      className={cn(
                        "flex-1 aspect-square rounded-sm transition-colors",
                        getIntensity(count, max),
                      )}
                      title={`${dayLabels[dayIdx]} ${hourIdx}:00 — ${count}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
