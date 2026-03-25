import { Card } from "@/components/ui/card";

interface ActivityItem {
  id: string;
  businessName: string;
  platform: "messenger" | "instagram";
  customerName: string | null;
  stage: string;
  status: "active" | "handoff" | "completed" | "abandoned";
  lastMessageAt: string;
}

interface LiveActivityFeedProps {
  items: ActivityItem[];
}

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  active: { bg: "bg-primary/10", text: "text-primary", label: "AI Handling" },
  handoff: { bg: "bg-amber-50", text: "text-amber-700", label: "Handoff" },
  completed: {
    bg: "bg-surface-container",
    text: "text-on-surface-variant",
    label: "Closed",
  },
  abandoned: { bg: "bg-red-50", text: "text-red-600", label: "Abandoned" },
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function LiveActivityFeed({ items }: LiveActivityFeedProps) {
  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          Live Activity Feed
        </h3>
        <span className="text-[10px] text-on-surface-variant">Last 20</span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[400px] p-3 bg-surface-container-low/50 grid grid-cols-[2rem_1fr_5rem_4rem_3.5rem] gap-2 text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/10">
          <span>Plat</span>
          <span>Customer / Business</span>
          <span>Status</span>
          <span>Stage</span>
          <span className="text-right">Time</span>
        </div>

        <div className="divide-y divide-outline-variant/5 max-h-[480px] overflow-y-auto min-w-[400px]">
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-on-surface-variant">
              No recent activity
            </div>
          ) : (
            items.map((item) => {
              const style = STATUS_STYLES[item.status] || STATUS_STYLES.active;
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[2rem_1fr_5rem_4rem_3.5rem] gap-2 items-center p-3 hover:bg-surface-container-low/50 transition-colors"
                >
                  <span className="text-center">
                    {item.platform === "messenger" ? (
                      <span className="text-blue-500 text-sm">💬</span>
                    ) : (
                      <span className="text-pink-500 text-sm">📸</span>
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-on-surface truncate">
                      {item.customerName || "Guest"}
                    </p>
                    <p className="text-[10px] text-on-surface-variant truncate">
                      {item.businessName}
                    </p>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase text-center ${style.bg} ${style.text}`}
                  >
                    {style.label}
                  </span>
                  <span className="text-[10px] text-on-surface-variant truncate">
                    {item.stage}
                  </span>
                  <span className="text-right text-[10px] font-mono text-on-surface-variant">
                    {formatTime(item.lastMessageAt)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Card>
  );
}
