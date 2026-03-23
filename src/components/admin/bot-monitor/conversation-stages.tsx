import { Card } from "@/components/ui/card";

interface StageData {
  stage: string;
  count: number;
}

interface ConversationStagesProps {
  stages: StageData[];
}

const STAGE_LABELS: Record<string, string> = {
  greeting: "Greeting",
  product_browsing: "Browsing",
  cart: "Cart",
  checkout: "Checkout",
  completed: "Completed",
};

const STAGE_COLORS = [
  "bg-primary",
  "bg-primary/80",
  "bg-primary/60",
  "bg-amber-500",
  "bg-green-500",
];

export function ConversationStages({ stages }: ConversationStagesProps) {
  const orderedStages = [
    "greeting",
    "product_browsing",
    "cart",
    "checkout",
    "completed",
  ];

  const stageMap = new Map(stages.map((s) => [s.stage, s.count]));
  const ordered = orderedStages.map((s) => ({
    stage: s,
    label: STAGE_LABELS[s] || s,
    count: stageMap.get(s) || 0,
  }));

  const maxCount = Math.max(...ordered.map((s) => s.count), 1);
  const totalStart = ordered[0]?.count || 1;

  return (
    <Card className="p-6">
      <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-5">
        Conversation Stage Funnel
      </h3>

      {totalStart === 0 ? (
        <p className="text-sm text-on-surface-variant">
          No active conversations
        </p>
      ) : (
        <div className="space-y-2">
          {ordered.map((item, i) => {
            const widthPct = Math.max((item.count / maxCount) * 100, 8);
            const dropOff =
              i > 0 && ordered[i - 1].count > 0
                ? (
                    ((ordered[i - 1].count - item.count) /
                      ordered[i - 1].count) *
                    100
                  ).toFixed(0)
                : null;

            return (
              <div key={item.stage}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-on-surface">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {dropOff !== null && Number(dropOff) > 0 && (
                      <span className="text-[10px] text-red-500 font-mono">
                        -{dropOff}%
                      </span>
                    )}
                    <span className="text-xs font-mono text-on-surface-variant">
                      {item.count}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-surface-container-high h-3 rounded-full overflow-hidden flex justify-center">
                  <div
                    className={`${STAGE_COLORS[i] || "bg-primary"} h-full rounded-full transition-all`}
                    style={{ width: `${widthPct}%` }}
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
