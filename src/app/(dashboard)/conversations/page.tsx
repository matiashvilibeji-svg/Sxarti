"use client";

import { ChatView, ConversationList } from "@/components/chat";
import { useSupabase } from "@/hooks/use-supabase";
import { useTenant } from "@/hooks/use-tenant";
import type { Conversation } from "@/types";
import { useCallback, useEffect, useState } from "react";

export default function ConversationsPage() {
  const supabase = useSupabase();
  const { tenant, loading: tenantLoading } = useTenant();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fetch conversations
  useEffect(() => {
    if (!tenant) return;

    let cancelled = false;

    async function fetch() {
      setLoading(true);
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("tenant_id", tenant!.id)
        .order("last_message_at", { ascending: false });

      if (!cancelled) {
        if (!error && data) {
          setConversations(data as Conversation[]);
        }
        setLoading(false);
      }
    }

    fetch();

    return () => {
      cancelled = true;
    };
  }, [tenant, supabase]);

  // Realtime subscription for conversation updates
  useEffect(() => {
    if (!tenant) return;

    const channel = supabase
      .channel("conversations:all")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `tenant_id=eq.${tenant.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setConversations((prev) => [payload.new as Conversation, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === (payload.new as Conversation).id
                  ? (payload.new as Conversation)
                  : c,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant, supabase]);

  const selectedConversation =
    conversations.find((c) => c.id === selectedId) ?? null;

  const handleStatusChange = useCallback(
    (id: string, status: Conversation["status"]) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c)),
      );
    },
    [],
  );

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)]">
      {/* Left panel — conversation list */}
      <div className="w-80 shrink-0 border-r border-outline-variant/20 bg-surface-container-lowest">
        <ConversationList
          conversations={conversations}
          loading={loading || tenantLoading}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      {/* Center panel — chat */}
      <div className="flex-1 bg-surface-container-lowest">
        <ChatView
          conversationId={selectedId}
          conversation={selectedConversation}
          tenantId={tenant?.id ?? ""}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* Right panel — customer info */}
      {selectedConversation && (
        <div className="hidden w-72 shrink-0 border-l border-outline-variant/20 bg-surface-container-lowest p-4 xl:block">
          <h4 className="text-sm font-semibold text-on-surface">
            მომხმარებლის ინფო
          </h4>

          <div className="mt-4 space-y-3">
            <InfoRow
              label="სახელი"
              value={selectedConversation.customer_name}
            />
            <InfoRow
              label="პლატფორმა"
              value={
                selectedConversation.platform === "messenger"
                  ? "Facebook Messenger"
                  : "Instagram"
              }
            />
            <InfoRow label="ეტაპი" value={selectedConversation.current_stage} />
            {selectedConversation.customer_info?.phone && (
              <InfoRow
                label="ტელეფონი"
                value={selectedConversation.customer_info.phone}
              />
            )}
            {selectedConversation.customer_info?.address && (
              <InfoRow
                label="მისამართი"
                value={selectedConversation.customer_info.address}
              />
            )}
            {selectedConversation.customer_info?.city && (
              <InfoRow
                label="ქალაქი"
                value={selectedConversation.customer_info.city}
              />
            )}
            {selectedConversation.cart.length > 0 && (
              <div>
                <span className="text-xs text-on-surface-variant/60">
                  კალათა
                </span>
                <p className="text-sm text-on-surface">
                  {selectedConversation.cart.length} ნივთი
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs text-on-surface-variant/60">{label}</span>
      <p className="text-sm text-on-surface">{value}</p>
    </div>
  );
}
