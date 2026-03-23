import { Card } from "@/components/ui/card";

interface DailyVolume {
  date: string;
  messenger: number;
  instagram: number;
  handoffRate: number;
}

interface ConversationVolumeChartProps {
  data: DailyVolume[];
}

export function ConversationVolumeChart({
  data,
}: ConversationVolumeChartProps) {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-4">
          Conversation Volume (30 Days)
        </h3>
        <p className="text-sm text-on-surface-variant">No data available</p>
      </Card>
    );
  }

  const maxTotal = Math.max(...data.map((d) => d.messenger + d.instagram), 1);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">
          Conversation Volume (30 Days)
        </h3>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
            Messenger
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-pink-500" />
            Instagram
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-amber-500" />
            Handoff %
          </span>
        </div>
      </div>

      <div className="flex items-end gap-[3px] h-40">
        {data.map((day) => {
          const total = day.messenger + day.instagram;
          const heightPct = (total / maxTotal) * 100;
          const messengerPct =
            total > 0 ? (day.messenger / total) * heightPct : 0;
          const instagramPct =
            total > 0 ? (day.instagram / total) * heightPct : 0;

          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col justify-end h-full group relative"
            >
              <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                {total} convos
              </div>
              <div
                className="bg-pink-500 rounded-t-sm w-full"
                style={{
                  height: `${instagramPct}%`,
                  minHeight: instagramPct > 0 ? 1 : 0,
                }}
              />
              <div
                className="bg-primary w-full"
                style={{
                  height: `${messengerPct}%`,
                  minHeight: messengerPct > 0 ? 1 : 0,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Handoff rate trend */}
      <div className="mt-4 pt-3 border-t border-outline-variant/20">
        <div className="flex items-center gap-2 text-[10px] text-on-surface-variant mb-2">
          <span className="font-semibold uppercase tracking-widest">
            Handoff Rate Trend
          </span>
        </div>
        <div className="flex items-end gap-[3px] h-10">
          {data.map((day) => (
            <div
              key={day.date}
              className="flex-1 flex flex-col justify-end h-full"
            >
              <div
                className="bg-amber-400 rounded-t-sm w-full"
                style={{
                  height: `${Math.min(day.handoffRate * 3, 100)}%`,
                  minHeight: day.handoffRate > 0 ? 1 : 0,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-2 text-[9px] text-on-surface-variant font-mono">
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data[Math.floor(data.length / 2)]?.date.slice(5)}</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </Card>
  );
}
