import { Card } from "@/components/ui/card";

interface HandoffReason {
  reason: string;
  count: number;
}

interface HandoffReasonsProps {
  reasons: HandoffReason[];
}

export function HandoffReasons({ reasons }: HandoffReasonsProps) {
  const top5 = reasons.slice(0, 5);
  const maxCount = Math.max(...top5.map((r) => r.count), 1);

  return (
    <Card className="p-6">
      <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-5">
        Handoff Reasons
      </h3>

      {top5.length === 0 ? (
        <p className="text-sm text-on-surface-variant">No handoffs recorded</p>
      ) : (
        <div className="space-y-3">
          {top5.map((item) => {
            const pct = (item.count / maxCount) * 100;
            return (
              <div key={item.reason}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-on-surface font-medium truncate max-w-[70%]">
                    {item.reason || "Unknown"}
                  </span>
                  <span className="text-xs font-mono text-on-surface-variant">
                    {item.count}
                  </span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
