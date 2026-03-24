import { createAdminClient } from "@/lib/supabase/admin";
import type { MessageAttachment } from "@/types/database";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_AUDIO_SIZE = 5 * 1024 * 1024; // 5MB

const MIME_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/aac": "aac",
  "video/mp4": "mp4",
};

interface WebhookAttachmentInput {
  type: "image" | "audio" | "video" | "file";
  url: string;
}

/**
 * Downloads media from a Facebook/Instagram CDN URL (temporary, ~24hr expiry),
 * uploads to Supabase Storage, and returns a permanent attachment record.
 */
export async function processAttachments(
  tenantId: string,
  conversationId: string,
  attachments: WebhookAttachmentInput[],
): Promise<MessageAttachment[]> {
  const results: MessageAttachment[] = [];
  const supabase = createAdminClient();

  for (const attachment of attachments) {
    try {
      const result = await downloadAndStore(
        supabase,
        tenantId,
        conversationId,
        attachment,
      );
      if (result) results.push(result);
    } catch (error) {
      console.error("Failed to process attachment:", attachment.type, error);
    }
  }

  return results;
}

async function downloadAndStore(
  supabase: ReturnType<typeof createAdminClient>,
  tenantId: string,
  conversationId: string,
  attachment: WebhookAttachmentInput,
): Promise<MessageAttachment | null> {
  // Download from CDN
  const response = await fetch(attachment.url, {
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    console.error(`Failed to download media: HTTP ${response.status}`);
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const mimeType = detectMimeType(contentType, attachment.type);
  const extension = MIME_MAP[mimeType] ?? "bin";

  // Determine effective type from mime
  const effectiveType = getEffectiveType(mimeType, attachment.type);

  // Size check
  const maxSize = effectiveType === "image" ? MAX_IMAGE_SIZE : MAX_AUDIO_SIZE;
  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > maxSize) {
    console.warn(
      `Attachment too large: ${contentLength} bytes (max ${maxSize})`,
    );
    return null;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > maxSize) {
    console.warn(
      `Attachment too large after download: ${buffer.byteLength} bytes`,
    );
    return null;
  }

  // Upload to Supabase Storage
  const timestamp = Date.now();
  const filename = `${tenantId}/${conversationId}/${timestamp}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("chat-media")
    .upload(filename, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    console.error("Supabase upload error:", uploadError);
    return null;
  }

  const { data: publicUrlData } = supabase.storage
    .from("chat-media")
    .getPublicUrl(filename);

  return {
    type: effectiveType,
    url: publicUrlData.publicUrl,
    mime_type: mimeType,
    original_url: attachment.url,
  };
}

function detectMimeType(contentType: string, fallbackType: string): string {
  // Content-Type header may include charset etc.
  const mime = contentType.split(";")[0].trim().toLowerCase();

  if (MIME_MAP[mime]) return mime;

  // Fallback based on attachment type
  switch (fallbackType) {
    case "image":
      return "image/jpeg";
    case "audio":
      return "audio/mp4";
    case "video":
      return "video/mp4";
    default:
      return "application/octet-stream";
  }
}

function getEffectiveType(
  mimeType: string,
  originalType: string,
): "image" | "audio" | "video" | "file" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  // Trust original type if mime doesn't help
  if (["image", "audio", "video", "file"].includes(originalType)) {
    return originalType as "image" | "audio" | "video" | "file";
  }
  return "file";
}

/**
 * Downloads media from a URL and returns it as a base64 string for Gemini API.
 */
export async function downloadAsBase64(
  url: string,
): Promise<{ data: string; mimeType: string } | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    const mimeType =
      contentType.split(";")[0].trim().toLowerCase() ||
      "application/octet-stream";
    const buffer = Buffer.from(await response.arrayBuffer());
    const data = buffer.toString("base64");

    return { data, mimeType };
  } catch (error) {
    console.error("Failed to download media for Gemini:", error);
    return null;
  }
}
