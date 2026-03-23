"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { sendReply } from "@/app/admin/support/actions";
import { Send } from "lucide-react";

interface TicketReplyFormProps {
  ticketId: string;
  isClosed?: boolean;
}

const quickTemplates = [
  {
    label: "Refund Policy",
    text: "Regarding our refund policy, we offer a full refund within 30 days of purchase. I'll initiate the process for you now.",
  },
  {
    label: "Looking Into It",
    text: "Thank you for reporting this. We're currently investigating the issue and will get back to you shortly.",
  },
  {
    label: "Resolved",
    text: "This issue has been resolved. Please let us know if you experience any further problems.",
  },
];

export function TicketReplyForm({ ticketId, isClosed }: TicketReplyFormProps) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSend = (closeAfter?: boolean) => {
    if (!content.trim()) return;
    startTransition(async () => {
      await sendReply(ticketId, content.trim(), closeAfter);
      setContent("");
      router.refresh();
    });
  };

  return (
    <div className="border-t border-surface-container-high bg-surface-container-lowest p-4 space-y-3">
      {/* Quick templates */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {quickTemplates.map((tpl) => (
          <button
            key={tpl.label}
            onClick={() => setContent(tpl.text)}
            className="px-3 py-1.5 rounded-lg bg-surface-container-low text-[11px] font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors whitespace-nowrap flex-shrink-0"
          >
            {tpl.label}
          </button>
        ))}
      </div>

      <Textarea
        placeholder={isClosed ? "Ticket is closed" : "Type your response..."}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        disabled={isPending || isClosed}
        className="resize-none"
      />

      <div className="flex justify-between items-center">
        <div />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!content.trim() || isPending || isClosed}
            onClick={() => handleSend(true)}
          >
            Close & Reply
          </Button>
          <Button
            size="sm"
            disabled={!content.trim() || isPending || isClosed}
            onClick={() => handleSend(false)}
          >
            <Send className="h-4 w-4 mr-1.5" />
            Send Reply
          </Button>
        </div>
      </div>
    </div>
  );
}
