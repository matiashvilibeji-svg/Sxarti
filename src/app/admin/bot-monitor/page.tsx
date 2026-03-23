import { createAdminClient } from "@/lib/supabase/admin";
import { BotStatsGrid } from "@/components/admin/bot-monitor/bot-stats-grid";
import { ConversationVolumeChart } from "@/components/admin/bot-monitor/conversation-volume-chart";
import { TenantBotTable } from "@/components/admin/bot-monitor/tenant-bot-table";
import type { TenantBotRow } from "@/components/admin/bot-monitor/tenant-bot-table";
import { HandoffReasons } from "@/components/admin/bot-monitor/handoff-reasons";
import { ConversationStages } from "@/components/admin/bot-monitor/conversation-stages";
import { PlatformBreakdown } from "@/components/admin/bot-monitor/platform-breakdown";
import { LiveActivityFeed } from "@/components/admin/bot-monitor/live-activity-feed";

export const dynamic = "force-dynamic";

interface ConversationRow {
  id: string;
  tenant_id: string;
  platform: "messenger" | "instagram";
  status: "active" | "handoff" | "completed" | "abandoned";
  current_stage: string;
  customer_name: string | null;
  handoff_reason: string | null;
  handed_off_at: string | null;
  started_at: string;
  last_message_at: string;
  tenants: { business_name: string } | null;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  tenant_id: string;
  sender: "customer" | "bot" | "human";
  created_at: string;
}

export default async function BotMonitorPage() {
  const supabase = createAdminClient();
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).toISOString();
  const thirtyDaysAgo = new Date(
    now.getTime() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Fetch conversations with tenant info
  const { data: conversations } = await supabase
    .from("conversations")
    .select(
      "id, tenant_id, platform, status, current_stage, customer_name, handoff_reason, handed_off_at, started_at, last_message_at, tenants(business_name)",
    )
    .returns<ConversationRow[]>();

  const allConvos = conversations || [];

  // Fetch messages
  const { data: messages } = await supabase
    .from("messages")
    .select("id, conversation_id, tenant_id, sender, created_at")
    .returns<MessageRow[]>();

  const allMessages = messages || [];

  // === KPI Stats ===
  const activeConversations = allConvos.filter(
    (c) => c.status === "active",
  ).length;
  const completedConvos = allConvos.filter(
    (c) => c.status === "completed",
  ).length;
  const handoffConvos = allConvos.filter((c) => c.status === "handoff").length;
  const totalCompleted = completedConvos + handoffConvos;
  const botResolutionRate =
    totalCompleted > 0 ? (completedConvos / totalCompleted) * 100 : 0;
  const handoffRate =
    totalCompleted > 0 ? (handoffConvos / totalCompleted) * 100 : 0;

  const messageCounts = new Map<string, number>();
  for (const m of allMessages) {
    messageCounts.set(
      m.conversation_id,
      (messageCounts.get(m.conversation_id) || 0) + 1,
    );
  }
  const convoWithMessages = allConvos.filter((c) => messageCounts.has(c.id));
  const avgMessagesPerConvo =
    convoWithMessages.length > 0
      ? allMessages.length / convoWithMessages.length
      : 0;

  const totalMessagesToday = allMessages.filter(
    (m) => m.created_at >= todayStart,
  ).length;

  const attentionNeeded = allConvos.filter(
    (c) =>
      c.status === "handoff" &&
      !allMessages.some(
        (m) => m.conversation_id === c.id && m.sender === "human",
      ),
  ).length;

  // === Conversation Volume (30 days) ===
  const recentConvos = allConvos.filter((c) => c.started_at >= thirtyDaysAgo);
  const volumeMap = new Map<
    string,
    { messenger: number; instagram: number; handoffs: number; total: number }
  >();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    volumeMap.set(key, { messenger: 0, instagram: 0, handoffs: 0, total: 0 });
  }
  for (const c of recentConvos) {
    const day = c.started_at.slice(0, 10);
    const entry = volumeMap.get(day);
    if (entry) {
      entry.total++;
      if (c.platform === "messenger") entry.messenger++;
      else entry.instagram++;
      if (c.status === "handoff") entry.handoffs++;
    }
  }
  const volumeData = Array.from(volumeMap.entries()).map(([date, v]) => ({
    date,
    messenger: v.messenger,
    instagram: v.instagram,
    handoffRate: v.total > 0 ? (v.handoffs / v.total) * 100 : 0,
  }));

  // === Tenant Bot Table ===
  const tenantMap = new Map<
    string,
    {
      businessName: string;
      active: number;
      total: number;
      completed: number;
      handoff: number;
      msgCount: number;
      lastActivity: string | null;
    }
  >();
  for (const c of allConvos) {
    const name = c.tenants?.business_name || "Unknown";
    if (!tenantMap.has(c.tenant_id)) {
      tenantMap.set(c.tenant_id, {
        businessName: name,
        active: 0,
        total: 0,
        completed: 0,
        handoff: 0,
        msgCount: 0,
        lastActivity: null,
      });
    }
    const t = tenantMap.get(c.tenant_id)!;
    t.total++;
    if (c.status === "active") t.active++;
    if (c.status === "completed") t.completed++;
    if (c.status === "handoff") t.handoff++;
    t.msgCount += messageCounts.get(c.id) || 0;
    if (!t.lastActivity || c.last_message_at > t.lastActivity) {
      t.lastActivity = c.last_message_at;
    }
  }
  const tenantRows: TenantBotRow[] = Array.from(tenantMap.entries()).map(
    ([tenantId, t]) => {
      const resolved = t.completed + t.handoff;
      return {
        tenantId,
        businessName: t.businessName,
        activeConvos: t.active,
        totalThisMonth: t.total,
        botResolutionPct: resolved > 0 ? (t.completed / resolved) * 100 : 0,
        avgMessages: t.total > 0 ? t.msgCount / t.total : 0,
        lastActivityAt: t.lastActivity,
      };
    },
  );

  // === Handoff Reasons ===
  const reasonCounts = new Map<string, number>();
  for (const c of allConvos) {
    if (c.status === "handoff" && c.handoff_reason) {
      reasonCounts.set(
        c.handoff_reason,
        (reasonCounts.get(c.handoff_reason) || 0) + 1,
      );
    }
  }
  const handoffReasons = Array.from(reasonCounts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  // === Conversation Stages ===
  const stageCounts = new Map<string, number>();
  for (const c of allConvos) {
    if (c.status === "active" || c.status === "handoff") {
      stageCounts.set(
        c.current_stage,
        (stageCounts.get(c.current_stage) || 0) + 1,
      );
    }
  }
  const stageData = Array.from(stageCounts.entries()).map(([stage, count]) => ({
    stage,
    count,
  }));

  // === Platform Breakdown ===
  function platformMetrics(platform: "messenger" | "instagram") {
    const pConvos = allConvos.filter((c) => c.platform === platform);
    const pCompleted = pConvos.filter((c) => c.status === "completed").length;
    const pHandoff = pConvos.filter((c) => c.status === "handoff").length;
    const pResolved = pCompleted + pHandoff;
    const pMsgCount = pConvos.reduce(
      (sum, c) => sum + (messageCounts.get(c.id) || 0),
      0,
    );
    return {
      volume: pConvos.length,
      completionRate: pResolved > 0 ? (pCompleted / pResolved) * 100 : 0,
      avgMessages: pConvos.length > 0 ? pMsgCount / pConvos.length : 0,
      handoffRate: pResolved > 0 ? (pHandoff / pResolved) * 100 : 0,
    };
  }

  // === Live Activity Feed ===
  const recentActivity = [...allConvos]
    .sort(
      (a, b) =>
        new Date(b.last_message_at).getTime() -
        new Date(a.last_message_at).getTime(),
    )
    .slice(0, 20)
    .map((c) => ({
      id: c.id,
      businessName: c.tenants?.business_name || "Unknown",
      platform: c.platform,
      customerName: c.customer_name,
      stage: c.current_stage,
      status: c.status,
      lastMessageAt: c.last_message_at,
    }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">
          Bot Monitor
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Real-time surveillance and health metrics for Sxarti AI instances.
        </p>
      </div>

      {/* KPI Grid */}
      <BotStatsGrid
        activeConversations={activeConversations}
        botResolutionRate={botResolutionRate}
        handoffRate={handoffRate}
        avgMessagesPerConvo={avgMessagesPerConvo}
        totalMessagesToday={totalMessagesToday}
        attentionNeeded={attentionNeeded}
      />

      {/* Main Grid: Feed + Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <LiveActivityFeed items={recentActivity} />
        </div>
        <div className="lg:col-span-5 space-y-6">
          <HandoffReasons reasons={handoffReasons} />
          <ConversationStages stages={stageData} />
        </div>
      </div>

      {/* Volume Chart */}
      <ConversationVolumeChart data={volumeData} />

      {/* Platform Breakdown */}
      <PlatformBreakdown
        messenger={platformMetrics("messenger")}
        instagram={platformMetrics("instagram")}
      />

      {/* Tenant Table */}
      <TenantBotTable rows={tenantRows} />
    </div>
  );
}
