"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { SupportTicket, AdminUser } from "@/types/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  updateTicketStatus,
  updateTicketPriority,
  assignTicket,
} from "@/app/admin/support/actions";
import { ArrowLeft, ChevronDown } from "lucide-react";

interface TicketDetailHeaderProps {
  ticket: SupportTicket;
  admins: AdminUser[];
}

const priorityStyles: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-amber-100 text-amber-700",
  medium: "bg-blue-100 text-blue-700",
  low: "bg-slate-100 text-slate-600",
};

const statusStyles: Record<string, string> = {
  open: "bg-teal-100 text-teal-700",
  in_progress: "bg-blue-100 text-blue-700",
  waiting: "bg-orange-100 text-orange-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-slate-100 text-slate-600",
};

const statusLabels: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting: "Waiting",
  resolved: "Resolved",
  closed: "Closed",
};

const categoryLabels: Record<string, string> = {
  billing: "Billing",
  technical: "Technical",
  bot: "Bot",
  account: "Account",
  feature_request: "Feature Request",
  other: "Other",
};

export function TicketDetailHeader({
  ticket,
  admins,
}: TicketDetailHeaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (status: string) => {
    startTransition(async () => {
      await updateTicketStatus(ticket.id, status);
    });
  };

  const handlePriorityChange = (priority: string) => {
    startTransition(async () => {
      await updateTicketPriority(ticket.id, priority);
    });
  };

  const handleAssign = (adminId: string | null) => {
    startTransition(async () => {
      await assignTicket(ticket.id, adminId);
    });
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => router.push("/admin/support")}
        className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tickets
      </button>

      <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                #{ticket.ticket_number}
              </span>

              {/* Status dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={isPending}>
                  <button
                    className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase inline-flex items-center gap-1 ${statusStyles[ticket.status]}`}
                  >
                    {statusLabels[ticket.status]}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => handleStatusChange(key)}
                      disabled={key === ticket.status}
                    >
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Priority dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={isPending}>
                  <button
                    className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase inline-flex items-center gap-1 ${priorityStyles[ticket.priority]}`}
                  >
                    {ticket.priority}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Change Priority</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(["low", "medium", "high", "critical"] as const).map((p) => (
                    <DropdownMenuItem
                      key={p}
                      onClick={() => handlePriorityChange(p)}
                      disabled={p === ticket.priority}
                    >
                      <span className="capitalize">{p}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <h1 className="text-xl font-bold font-headline text-on-surface">
              {ticket.subject}
            </h1>
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={
              isPending ||
              ticket.status === "closed" ||
              ticket.status === "resolved"
            }
            onClick={() => handleStatusChange("closed")}
          >
            Close Ticket
          </Button>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-on-surface-variant">
          <div>
            <span className="font-medium">Business: </span>
            <span className="text-on-surface font-semibold">
              {ticket.tenant?.business_name || "Unknown"}
            </span>
          </div>
          {ticket.category && (
            <div>
              <span className="font-medium">Category: </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {categoryLabels[ticket.category] || ticket.category}
              </Badge>
            </div>
          )}
          <div>
            <span className="font-medium">Assigned: </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={isPending}>
                <button className="text-on-surface font-semibold hover:underline inline-flex items-center gap-1">
                  {ticket.assigned_admin?.display_name || "Unassigned"}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Assign To</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleAssign(null)}>
                  Unassigned
                </DropdownMenuItem>
                {admins.map((admin) => (
                  <DropdownMenuItem
                    key={admin.id}
                    onClick={() => handleAssign(admin.id)}
                  >
                    {admin.display_name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div>
            <span className="font-medium">Created: </span>
            {new Date(ticket.created_at).toLocaleString()}
          </div>
          <div>
            <span className="font-medium">Updated: </span>
            {new Date(ticket.updated_at).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
