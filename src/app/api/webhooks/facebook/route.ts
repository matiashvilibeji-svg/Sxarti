import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookChallenge,
  verifyWebhookSignature,
  parseWebhookPayload,
} from "@/lib/facebook/webhook";
import { processMessage } from "@/lib/ai/pipeline";

// Facebook webhook verification (GET)
export async function GET(request: NextRequest) {
  const result = verifyWebhookChallenge(request.nextUrl.searchParams);

  if (result.valid && result.challenge) {
    return new NextResponse(result.challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// Facebook webhook messages (POST)
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = parseWebhookPayload(body);

  // Process each message — catch per-message to avoid one failure blocking others
  for (const msg of messages) {
    try {
      await processMessage({
        platform: "messenger",
        platformUserId: msg.senderId,
        pageId: msg.recipientId,
        messageText: msg.messageText,
        platformMessageId: msg.messageId,
      });
    } catch (error) {
      console.error("Error processing Facebook message:", error);
    }
  }

  // Always return 200 to Facebook (otherwise it retries)
  return NextResponse.json({ status: "ok" });
}
