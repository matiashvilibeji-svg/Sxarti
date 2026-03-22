"use client";

import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import { format } from "date-fns";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isCustomer = message.sender === "customer";
  const isBot = message.sender === "bot";
  const isHuman = message.sender === "human";

  return (
    <div
      className={cn(
        "flex flex-col gap-1 max-w-[75%]",
        isCustomer ? "self-start items-start" : "self-end items-end",
      )}
    >
      {!isCustomer && (
        <span className="text-[10px] text-on-surface-variant/60 px-1">
          {isBot ? "ბოტი" : "ოპერატორი"}
        </span>
      )}
      <div
        className={cn(
          "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isCustomer &&
            "bg-surface-container-high text-on-surface rounded-tl-sm",
          isBot && "bg-primary text-primary-foreground rounded-tr-sm",
          isHuman && "bg-tertiary text-white rounded-tr-sm",
        )}
      >
        {message.content}
      </div>
      <span className="text-[10px] text-on-surface-variant/60 px-1">
        {format(new Date(message.created_at), "HH:mm")}
      </span>
    </div>
  );
}
