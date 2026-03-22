"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { ka } from "date-fns/locale";
import { PlatformBadge } from "./platform-badge";
import { StatusBadge } from "./status-badge";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function truncate(text: string | undefined, max: number): string {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: ConversationItemProps) {
  const relativeTime = formatDistanceToNow(
    new Date(conversation.last_message_at),
    { addSuffix: true, locale: ka },
  );

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors",
        "hover:bg-surface-container-high",
        isSelected && "bg-primary/10",
      )}
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
          {getInitials(conversation.customer_name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-on-surface truncate">
            {conversation.customer_name || "უცნობი"}
          </span>
          <span className="text-[10px] text-on-surface-variant/60 shrink-0">
            {relativeTime}
          </span>
        </div>

        <p className="mt-0.5 text-xs text-on-surface-variant/80 truncate">
          {truncate(conversation.current_stage, 50)}
        </p>

        <div className="mt-1.5 flex items-center gap-1.5">
          <PlatformBadge platform={conversation.platform} />
          <StatusBadge status={conversation.status} />
        </div>
      </div>
    </button>
  );
}
