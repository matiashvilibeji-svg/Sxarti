"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useSupabase } from "@/hooks/use-supabase";
import type { Conversation, Message } from "@/types";
import { Bot, MessageCircle, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatInput } from "./chat-input";
import { MessageBubble } from "./message-bubble";
import { PlatformBadge } from "./platform-badge";
import { StatusBadge } from "./status-badge";

interface ChatViewProps {
  conversationId: string | null;
  conversation: Conversation | null;
  tenantId: string;
  onStatusChange: (id: string, status: Conversation["status"]) => void;
}

export function ChatView({
  conversationId,
  conversation,
  tenantId,
  onStatusChange,
}: ChatViewProps) {
  const supabase = useSupabase();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    async function fetchMessages() {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });

      if (!cancelled) {
        if (error) {
          console.error("Failed to fetch messages:", error);
        } else {
          setMessages(data ?? []);
        }
        setLoading(false);
      }
    }

    fetchMessages();

    return () => {
      cancelled = true;
    };
  }, [conversationId, supabase]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleTakeOver = async () => {
    if (!conversationId) return;
    const { error } = await supabase
      .from("conversations")
      .update({ status: "handoff", handed_off_at: new Date().toISOString() })
      .eq("id", conversationId);

    if (!error) {
      onStatusChange(conversationId, "handoff");
    }
  };

  const handleReleaseToBot = async () => {
    if (!conversationId) return;
    const { error } = await supabase
      .from("conversations")
      .update({ status: "active", handed_off_at: null })
      .eq("id", conversationId);

    if (!error) {
      onStatusChange(conversationId, "active");
    }
  };

  if (!conversationId || !conversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={MessageCircle}
          title="აირჩიეთ საუბარი"
          description="მარცხენა პანელიდან აირჩიეთ საუბარი მესიჯების სანახავად"
        />
      </div>
    );
  }

  const isHandoff = conversation.status === "handoff";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/20 px-4 py-3">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm font-semibold text-on-surface">
              {conversation.customer_name || "უცნობი"}
            </h3>
            <div className="mt-0.5 flex items-center gap-1.5">
              <PlatformBadge platform={conversation.platform} />
              <StatusBadge status={conversation.status} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isHandoff ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReleaseToBot}
              className="text-xs"
            >
              <Bot className="mr-1.5 h-3.5 w-3.5" />
              ბოტს გადაეცი
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTakeOver}
              className="text-xs"
            >
              <User className="mr-1.5 h-3.5 w-3.5" />
              აკონტროლე
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3 p-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
              >
                <Skeleton className="h-12 w-48 rounded-2xl" />
              </div>
            ))
          ) : messages.length === 0 ? (
            <p className="py-12 text-center text-sm text-on-surface-variant/60">
              ჯერ შეტყობინებები არ არის
            </p>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input — only shown in handoff mode */}
      {isHandoff && (
        <ChatInput conversationId={conversationId} tenantId={tenantId} />
      )}
    </div>
  );
}
