import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { AuditLogEntry } from "@/types/admin";

interface RecentActivityProps {
  entries: AuditLogEntry[];
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function RecentActivity({ entries }: RecentActivityProps) {
  return (
    <Card className="flex h-full flex-col rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="max-h-80 space-y-4 overflow-y-auto">
          {entries.length === 0 && (
            <p className="text-sm text-on-surface-variant">
              No recent activity.
            </p>
          )}
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-on-surface">
                    {entry.action}
                  </p>
                  <p className="text-[10px] uppercase text-on-surface-variant">
                    {entry.resource_type}
                    {entry.admin?.display_name
                      ? ` · ${entry.admin.display_name}`
                      : ""}
                  </p>
                </div>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-on-surface-variant">
                {timeAgo(entry.created_at)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
