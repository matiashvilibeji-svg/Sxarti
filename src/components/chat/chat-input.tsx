"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSupabase } from "@/hooks/use-supabase";
import { SendHorizonal } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface ChatInputProps {
  conversationId: string;
  tenantId: string;
}

export function ChatInput({ conversationId, tenantId }: ChatInputProps) {
  const supabase = useSupabase();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        tenant_id: tenantId,
        sender: "human",
        content: trimmed,
      });

      if (error) throw error;

      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  }, [content, sending, supabase, conversationId, tenantId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  return (
    <div className="flex items-end gap-2 border-t border-outline-variant/20 bg-surface-container-lowest p-3">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="დაწერეთ შეტყობინება..."
        disabled={sending}
        rows={1}
        className="min-h-[40px] max-h-[120px] resize-none"
      />
      <Button
        size="icon"
        onClick={handleSend}
        disabled={!content.trim() || sending}
        className="shrink-0 bg-gradient-cta hover:bg-gradient-cta-hover"
      >
        <SendHorizonal className="h-4 w-4" />
      </Button>
    </div>
  );
}
