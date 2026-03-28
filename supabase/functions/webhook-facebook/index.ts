import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function verifySignature(
  body: string,
  signature: string | null,
  appSecret: string,
): Promise<boolean> {
  if (!signature) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body),
  );

  const computed = `sha256=${Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
  return computed === signature;
}

serve(async (req) => {
  // Webhook verification (GET)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const verifyToken = Deno.env.get("FACEBOOK_VERIFY_TOKEN");

    if (mode === "subscribe" && token === verifyToken) {
      return new Response(challenge, { status: 200 });
    }

    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Message handling (POST)
  try {
    const appSecret = Deno.env.get("FACEBOOK_APP_SECRET");
    if (!appSecret) {
      return new Response("Server error", { status: 500 });
    }

    const body = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    const isValid = await verifySignature(body, signature, appSecret);
    if (!isValid) {
      return new Response("Invalid signature", { status: 401 });
    }

    const payload = JSON.parse(body);

    if (payload.object !== "page") {
      return new Response("OK", { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    for (const entry of payload.entry || []) {
      const pageId = entry.id;

      for (const event of entry.messaging || []) {
        const senderId = event.sender?.id;
        const messageText = event.message?.text;

        if (!senderId || !messageText) continue;

        // Find tenant by Facebook page ID
        const { data: tenant } = await supabase
          .from("tenants")
          .select("id")
          .eq("facebook_page_id", pageId)
          .single();

        if (!tenant) continue;

        // Find or create conversation
        let { data: conversation } = await supabase
          .from("conversations")
          .select("id")
          .eq("tenant_id", tenant.id)
          .eq("platform", "messenger")
          .eq("platform_user_id", senderId)
          .eq("status", "active")
          .single();

        if (!conversation) {
          const { data: newConv } = await supabase
            .from("conversations")
            .insert({
              tenant_id: tenant.id,
              platform: "messenger",
              platform_user_id: senderId,
              status: "active",
              current_stage: "greeting",
              cart: [],
            })
            .select("id")
            .single();
          conversation = newConv;
        }

        if (!conversation) continue;

        // Store incoming message
        const { data: storedMsg } = await supabase
          .from("messages")
          .insert({
            conversation_id: conversation.id,
            tenant_id: tenant.id,
            sender: "customer",
            content: messageText,
            platform_message_id: event.message?.mid || null,
          })
          .select("id, created_at")
          .single();

        if (!storedMsg) continue;

        // Debounce: wait 3 seconds then check if newer messages arrived
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const { data: newerMessages } = await supabase
          .from("messages")
          .select("id")
          .eq("conversation_id", conversation.id)
          .eq("sender", "customer")
          .gt("created_at", storedMsg.created_at)
          .limit(1);

        // If a newer customer message exists, skip AI call — that message's handler will process
        if (newerMessages && newerMessages.length > 0) {
          continue;
        }

        // Call ai-respond function
        const aiResponse = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-respond`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              conversation_id: conversation.id,
              tenant_id: tenant.id,
              message: messageText,
            }),
          },
        );

        if (aiResponse.ok) {
          const { reply } = await aiResponse.json();

          // Send reply via Facebook Graph API
          const { data: tenantFull } = await supabase
            .from("tenants")
            .select("facebook_access_token")
            .eq("id", tenant.id)
            .single();

          if (tenantFull?.facebook_access_token) {
            await fetch(`https://graph.facebook.com/v19.0/${pageId}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                recipient: { id: senderId },
                message: { text: reply },
                access_token: tenantFull.facebook_access_token,
              }),
            });
          }
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("OK", { status: 200 }); // Always return 200 to Facebook
  }
});
