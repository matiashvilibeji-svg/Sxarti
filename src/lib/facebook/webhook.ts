import { createHmac, timingSafeEqual } from "crypto";

export interface WebhookAttachment {
  type: "image" | "audio" | "video" | "file" | "fallback";
  payload?: {
    url?: string;
    sticker_id?: number;
  };
}

export interface FacebookWebhookMessage {
  senderId: string;
  recipientId: string;
  messageText: string;
  messageId: string;
  timestamp: number;
  attachments: WebhookAttachment[];
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
): boolean {
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appSecret || !signature) return false;

  const [algo, hash] = signature.split("=");
  if (algo !== "sha256" || !hash) return false;

  const expected = createHmac("sha256", appSecret)
    .update(payload)
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    return false;
  }
}

export function parseWebhookPayload(
  body: Record<string, unknown>,
): FacebookWebhookMessage[] {
  const messages: FacebookWebhookMessage[] = [];

  if (body.object !== "page") return messages;

  const entries = body.entry as Array<{
    messaging?: Array<{
      sender?: { id?: string };
      recipient?: { id?: string };
      message?: {
        mid?: string;
        text?: string;
        attachments?: WebhookAttachment[];
      };
      timestamp?: number;
    }>;
  }>;

  if (!Array.isArray(entries)) return messages;

  for (const entry of entries) {
    if (!Array.isArray(entry.messaging)) continue;

    for (const event of entry.messaging) {
      if (!event.sender?.id || !event.recipient?.id || !event.message) {
        continue;
      }

      const hasText = !!event.message.text;
      const attachments = (event.message.attachments ?? []).filter(
        (a) => a.type !== "fallback" && a.payload?.url,
      );
      const hasAttachments = attachments.length > 0;

      // Skip if neither text nor supported attachments
      if (!hasText && !hasAttachments) continue;

      messages.push({
        senderId: event.sender.id,
        recipientId: event.recipient.id,
        messageText: event.message.text ?? "",
        messageId: event.message.mid ?? "",
        timestamp: event.timestamp ?? Date.now(),
        attachments,
      });
    }
  }

  return messages;
}

export function verifyWebhookChallenge(params: URLSearchParams): {
  valid: boolean;
  challenge?: string;
} {
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.FACEBOOK_VERIFY_TOKEN &&
    challenge
  ) {
    return { valid: true, challenge };
  }

  return { valid: false };
}
