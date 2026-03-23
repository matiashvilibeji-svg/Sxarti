"use client";

import { useEffect, useRef } from "react";
import { SupportTicketMessage } from "@/types/admin";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TicketConversationProps {
  messages: SupportTicketMessage[];
}

export function TicketConversation({ messages }: TicketConversationProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-on-surface-variant text-sm">No messages yet.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-6 space-y-6">
        {messages.map((msg) => {
          const isAdmin = msg.sender_type === "admin";

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${
                isAdmin ? "ml-auto flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                  isAdmin
                    ? "bg-primary text-white"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                {isAdmin ? "A" : "T"}
              </div>

              <div
                className={`space-y-1 ${isAdmin ? "text-right" : "text-left"}`}
              >
                <div
                  className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    isAdmin
                      ? "bg-primary text-white rounded-tr-none shadow-primary/20"
                      : "bg-surface-container-lowest border border-surface-container-high rounded-tl-none"
                  }`}
                >
                  <p>{msg.content}</p>
                </div>
                <span className="text-[10px] text-on-surface-variant font-mono">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" · "}
                  {isAdmin ? "Admin" : "Tenant"}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
