"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";

const statusConfig: Record<
  Conversation["status"],
  { label: string; className: string }
> = {
  active: {
    label: "აქტიური",
    className:
      "bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20",
  },
  handoff: {
    label: "აკონტროლე",
    className:
      "bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/20",
  },
  completed: {
    label: "დასრულებული",
    className: "bg-muted text-muted-foreground border-muted hover:bg-muted",
  },
  abandoned: {
    label: "მიტოვებული",
    className:
      "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
  },
};

interface StatusBadgeProps {
  status: Conversation["status"];
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
