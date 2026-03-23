"use client";

import { SupportTicket } from "@/types/admin";
import {
  TicketIcon,
  Clock,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  UserX,
} from "lucide-react";

interface TicketStatsBarProps {
  tickets: SupportTicket[];
}

export function TicketStatsBar({ tickets }: TicketStatsBarProps) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter(
    (t) => t.status === "in_progress",
  ).length;
  const waitingCount = tickets.filter((t) => t.status === "waiting").length;
  const resolvedToday = tickets.filter(
    (t) =>
      (t.status === "resolved" || t.status === "closed") &&
      t.resolved_at &&
      new Date(t.resolved_at) >= todayStart,
  ).length;
  const unassigned = tickets.filter(
    (t) =>
      !t.assigned_admin_id && t.status !== "resolved" && t.status !== "closed",
  ).length;

  // Avg response time for resolved tickets (hours)
  const resolvedTickets = tickets.filter((t) => t.resolved_at);
  const avgResponseHours =
    resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => {
          const created = new Date(t.created_at).getTime();
          const resolved = new Date(t.resolved_at!).getTime();
          return sum + (resolved - created) / (1000 * 60 * 60);
        }, 0) / resolvedTickets.length
      : 0;

  const stats = [
    {
      label: "Open Tickets",
      value: openCount,
      icon: TicketIcon,
      iconBg: "bg-teal-50",
      iconColor: "text-teal-600",
    },
    {
      label: "In Progress",
      value: inProgressCount,
      icon: Loader2,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Waiting",
      value: waitingCount,
      icon: Clock,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      label: "Resolved Today",
      value: resolvedToday,
      icon: CheckCircle2,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      label: "Avg Resolution",
      value: avgResponseHours > 0 ? `${avgResponseHours.toFixed(1)}h` : "—",
      icon: Clock,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Unassigned",
      value: unassigned,
      icon: unassigned > 0 ? AlertTriangle : UserX,
      iconBg: unassigned > 0 ? "bg-red-50" : "bg-slate-50",
      iconColor: unassigned > 0 ? "text-red-600" : "text-slate-400",
      highlight: unassigned > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-surface-container-lowest rounded-xl p-4 shadow-sm"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-on-surface-variant text-xs font-medium">
              {stat.label}
            </span>
            <div className={`${stat.iconBg} p-1.5 rounded-lg`}>
              <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
            </div>
          </div>
          <span
            className={`text-2xl font-mono font-bold tracking-tight ${
              stat.highlight ? "text-red-600" : "text-on-surface"
            }`}
          >
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
