"use client";

import { cn } from "@/lib/utils";
import type { Message, MessageAttachment } from "@/types";
import { format } from "date-fns";
import { Volume2 } from "lucide-react";
import { useRef, useState } from "react";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isCustomer = message.sender === "customer";
  const isBot = message.sender === "bot";
  const isHuman = message.sender === "human";

  const attachments: MessageAttachment[] = message.attachments ?? [];
  const imageAttachments = attachments.filter((a) => a.type === "image");
  const audioAttachments = attachments.filter(
    (a) => a.type === "audio" || a.type === "video",
  );

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

      {/* Image attachments */}
      {imageAttachments.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {imageAttachments.map((att, i) => (
            <a
              key={i}
              href={att.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-2xl"
            >
              <img
                src={att.url}
                alt="მიმაგრებული სურათი"
                className="max-w-[260px] max-h-[260px] object-cover rounded-2xl"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      )}

      {/* Audio attachments */}
      {audioAttachments.map((att, i) => (
        <AudioPlayer key={i} attachment={att} isCustomer={isCustomer} />
      ))}

      {/* Text content */}
      {message.content && (
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
      )}

      <span className="text-[10px] text-on-surface-variant/60 px-1">
        {format(new Date(message.created_at), "HH:mm")}
      </span>
    </div>
  );
}

function AudioPlayer({
  attachment,
  isCustomer,
}: {
  attachment: MessageAttachment;
  isCustomer: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl px-3.5 py-2.5",
        isCustomer
          ? "bg-surface-container-high text-on-surface rounded-tl-sm"
          : "bg-primary text-primary-foreground rounded-tr-sm",
      )}
    >
      <button
        onClick={togglePlay}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
        aria-label={playing ? "პაუზა" : "დაკვრა"}
      >
        {playing ? (
          <span className="text-xs font-bold">II</span>
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </button>
      <span className="text-xs">ხმოვანი შეტყობინება</span>
      <audio
        ref={audioRef}
        src={attachment.url}
        onEnded={() => setPlaying(false)}
        preload="none"
      />
    </div>
  );
}
