import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessageWithRetry } from "@/lib/facebook/messenger";
import { sendInstagramMessageWithRetry } from "@/lib/instagram/messaging";
import type { Conversation, Tenant } from "@/types/database";

export async function POST(request: NextRequest) {
  const supabase = createClient();

  // Verify authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { conversation_id: string; content: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { conversation_id, content } = body;
  if (!conversation_id || !content?.trim()) {
    return NextResponse.json(
      { error: "conversation_id and content are required" },
      { status: 400 },
    );
  }

  // Use admin client for cross-table lookups
  const admin = createAdminClient();

  // Get conversation with tenant verification
  const { data: conversation, error: convError } = await admin
    .from("conversations")
    .select("*")
    .eq("id", conversation_id)
    .single();

  if (convError || !conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 },
    );
  }

  const typedConv = conversation as Conversation;

  // Verify the user owns this tenant
  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .select("*")
    .eq("id", typedConv.tenant_id)
    .eq("owner_id", user.id)
    .single();

  if (tenantError || !tenant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const typedTenant = tenant as Tenant;
  const trimmedContent = content.trim();

  // Store the message
  const { error: insertError } = await admin.from("messages").insert({
    conversation_id: typedConv.id,
    tenant_id: typedTenant.id,
    sender: "human",
    content: trimmedContent,
  });

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 },
    );
  }

  // Send to customer via platform
  try {
    if (typedConv.platform === "messenger") {
      if (!typedTenant.facebook_access_token) {
        return NextResponse.json(
          { error: "Facebook not connected" },
          { status: 400 },
        );
      }
      await sendMessageWithRetry(
        typedTenant.facebook_access_token,
        typedConv.platform_user_id,
        trimmedContent,
      );
    } else if (typedConv.platform === "instagram") {
      if (
        !typedTenant.facebook_access_token ||
        !typedTenant.instagram_account_id
      ) {
        return NextResponse.json(
          { error: "Instagram not connected" },
          { status: 400 },
        );
      }
      await sendInstagramMessageWithRetry(
        typedTenant.facebook_access_token,
        typedTenant.instagram_account_id,
        typedConv.platform_user_id,
        trimmedContent,
      );
    }
  } catch (error) {
    console.error("Failed to send message to platform:", error);
    // Message is saved in DB even if platform delivery fails
    return NextResponse.json(
      { error: "Message saved but delivery failed" },
      { status: 502 },
    );
  }

  // Update conversation: set status back to active if it was handoff
  if (typedConv.status === "handoff") {
    await admin
      .from("conversations")
      .update({
        status: "active",
        last_message_at: new Date().toISOString(),
      })
      .eq("id", typedConv.id);
  }

  return NextResponse.json({ status: "sent" });
}
