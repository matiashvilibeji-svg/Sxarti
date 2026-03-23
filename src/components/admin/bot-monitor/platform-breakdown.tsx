import { Card } from "@/components/ui/card";

interface PlatformMetrics {
  volume: number;
  completionRate: number;
  avgMessages: number;
  handoffRate: number;
}

interface PlatformBreakdownProps {
  messenger: PlatformMetrics;
  instagram: PlatformMetrics;
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-outline-variant/10 last:border-0">
      <span className="text-xs text-on-surface-variant">{label}</span>
      <span className="text-xs font-mono font-medium text-on-surface">
        {value}
      </span>
    </div>
  );
}

function PlatformColumn({
  name,
  icon,
  color,
  metrics,
}: {
  name: string;
  icon: string;
  color: string;
  metrics: PlatformMetrics;
}) {
  return (
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-lg ${color}`}>{icon}</span>
        <span className="text-sm font-semibold text-on-surface">{name}</span>
      </div>
      <MetricRow label="Volume" value={metrics.volume.toLocaleString()} />
      <MetricRow
        label="Completion Rate"
        value={`${metrics.completionRate.toFixed(1)}%`}
      />
      <MetricRow label="Avg Messages" value={metrics.avgMessages.toFixed(1)} />
      <MetricRow
        label="Handoff Rate"
        value={`${metrics.handoffRate.toFixed(1)}%`}
      />
    </div>
  );
}

export function PlatformBreakdown({
  messenger,
  instagram,
}: PlatformBreakdownProps) {
  return (
    <Card className="p-6">
      <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-5">
        Platform Comparison
      </h3>
      <div className="flex gap-6">
        <PlatformColumn
          name="Messenger"
          icon="💬"
          color="text-blue-600"
          metrics={messenger}
        />
        <div className="w-px bg-outline-variant/20" />
        <PlatformColumn
          name="Instagram"
          icon="📸"
          color="text-pink-500"
          metrics={instagram}
        />
      </div>
    </Card>
  );
}
