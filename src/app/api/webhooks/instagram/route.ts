import { NextRequest, NextResponse } from "next/server";
import {
  verifyInstagramWebhookChallenge,
  verifyInstagramSignature,
  parseInstagramWebhookPayload,
} from "@/lib/instagram/webhook";
import { processMessage } from "@/lib/ai/pipeline";

// Instagram webhook verification (GET)
export async function GET(request: NextRequest) {
  const result = verifyInstagramWebhookChallenge(request.nextUrl.searchParams);

  if (result.valid && result.challenge) {
    return new NextResponse(result.challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// Instagram webhook messages (POST)
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? "";

  if (!verifyInstagramSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = parseInstagramWebhookPayload(body);

  for (const msg of messages) {
    try {
      await processMessage({
        platform: "instagram",
        platformUserId: msg.senderId,
        pageId: msg.recipientId,
        messageText: msg.messageText,
        platformMessageId: msg.messageId,
        attachments: msg.attachments
          .filter((a) => a.payload?.url && a.type !== "fallback")
          .map((a) => ({
            type: a.type as "image" | "audio" | "video" | "file",
            url: a.payload!.url!,
          })),
      });
    } catch (error) {
      console.error("Error processing Instagram message:", error);
    }
  }

  return NextResponse.json({ status: "ok" });
}
