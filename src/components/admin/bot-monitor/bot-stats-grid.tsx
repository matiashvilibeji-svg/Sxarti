import {
  MessageSquare,
  Bot,
  ArrowRightLeft,
  Hash,
  MessagesSquare,
  AlertTriangle,
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";

interface BotStatsGridProps {
  activeConversations: number;
  botResolutionRate: number;
  handoffRate: number;
  avgMessagesPerConvo: number;
  totalMessagesToday: number;
  attentionNeeded: number;
}

export function BotStatsGrid({
  activeConversations,
  botResolutionRate,
  handoffRate,
  avgMessagesPerConvo,
  totalMessagesToday,
  attentionNeeded,
}: BotStatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <AdminStatCard
        title="Active Conversations"
        value={activeConversations.toLocaleString()}
        icon={MessageSquare}
        iconColor="text-primary"
        iconBg="bg-primary/10"
      />
      <AdminStatCard
        title="Bot Resolution Rate"
        value={`${botResolutionRate.toFixed(1)}%`}
        icon={Bot}
        iconColor="text-green-600"
        iconBg="bg-green-50"
      />
      <AdminStatCard
        title="Handoff Rate"
        value={`${handoffRate.toFixed(1)}%`}
        icon={ArrowRightLeft}
        iconColor={handoffRate > 15 ? "text-red-500" : "text-amber-500"}
        iconBg={handoffRate > 15 ? "bg-red-50" : "bg-amber-50"}
      />
      <AdminStatCard
        title="Avg Messages / Conversation"
        value={avgMessagesPerConvo.toFixed(1)}
        icon={Hash}
        iconColor="text-secondary"
        iconBg="bg-secondary/10"
      />
      <AdminStatCard
        title="Total Messages Today"
        value={totalMessagesToday.toLocaleString()}
        icon={MessagesSquare}
        iconColor="text-primary"
        iconBg="bg-primary/10"
      />
      <AdminStatCard
        title="Needs Attention"
        value={attentionNeeded.toLocaleString()}
        icon={AlertTriangle}
        iconColor={attentionNeeded > 0 ? "text-red-500" : "text-green-600"}
        iconBg={attentionNeeded > 0 ? "bg-red-50" : "bg-green-50"}
      />
    </div>
  );
}
