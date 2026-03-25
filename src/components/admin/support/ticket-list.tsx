"use client";

import { useRouter } from "next/navigation";
import { SupportTicket } from "@/types/admin";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserPlus } from "lucide-react";

interface TicketListProps {
  tickets: SupportTicket[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const priorityStyles: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-amber-100 text-amber-700",
  medium: "bg-blue-100 text-blue-700",
  low: "bg-slate-100 text-slate-600",
};

const priorityLabels: Record<string, string> = {
  critical: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const statusDot: Record<string, string> = {
  open: "bg-teal-500 animate-pulse",
  in_progress: "bg-blue-500",
  waiting: "bg-orange-500",
  resolved: "bg-green-500",
  closed: "bg-slate-300",
};

const statusLabels: Record<string, string> = {
  open: "Open",
  in_progress: "Active",
  waiting: "Waiting",
  resolved: "Resolved",
  closed: "Closed",
};

function timeAgo(dateStr: string) {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export function TicketList({
  tickets,
  totalCount,
  page,
  pageSize,
}: TicketListProps) {
  const router = useRouter();
  const totalPages = Math.ceil(totalCount / pageSize);

  if (tickets.length === 0) {
    return (
      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-12 text-center">
        <p className="text-on-surface-variant text-sm">No tickets found.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow className="bg-surface-container-low/30">
              <TableHead className="text-[11px] font-bold uppercase tracking-wider">
                Ticket ID
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider">
                Business
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider">
                Subject
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider">
                Priority
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider">
                Created
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider">
                Assigned
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow
                key={ticket.id}
                className={`cursor-pointer hover:bg-surface-container-low/50 transition-colors ${
                  ticket.priority === "critical"
                    ? "border-l-4 border-l-red-500"
                    : ""
                }`}
                onClick={() => router.push(`/admin/support/${ticket.id}`)}
              >
                <TableCell className="font-mono text-sm font-medium">
                  #{ticket.ticket_number}
                </TableCell>
                <TableCell className="text-sm font-semibold text-on-surface">
                  {ticket.tenant?.business_name || "—"}
                </TableCell>
                <TableCell className="text-sm text-on-surface-variant max-w-[200px] truncate">
                  {ticket.subject}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${
                      priorityStyles[ticket.priority]
                    }`}
                  >
                    {priorityLabels[ticket.priority]}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <div
                      className={`w-2 h-2 rounded-full ${statusDot[ticket.status]}`}
                    />
                    {statusLabels[ticket.status]}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-on-surface-variant">
                  {timeAgo(ticket.created_at)}
                </TableCell>
                <TableCell>
                  {ticket.assigned_admin ? (
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                      {ticket.assigned_admin.display_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center">
                      <UserPlus className="h-3.5 w-3.5 text-on-surface-variant" />
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-surface-container-high">
          <span className="text-xs text-on-surface-variant">
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, totalCount)} of {totalCount}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={(e) => {
                  e.stopPropagation();
                  const params = new URLSearchParams(window.location.search);
                  params.set("page", String(p));
                  router.push(`/admin/support?${params.toString()}`);
                }}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  p === page
                    ? "bg-primary text-white"
                    : "hover:bg-surface-container-low text-on-surface-variant"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
