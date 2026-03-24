import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildOwnerChatPrompt } from "@/lib/ai/prompts/owner-chat";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Content } from "@google/generative-ai";
import type {
  Tenant,
  KnowledgeEntry,
  KnowledgeDocument,
  BotInstruction,
  BehaviorRule,
} from "@/types/database";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  let body: {
    message: string;
    session_id?: string;
    tenant_id: string;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
    });
  }

  const { message, session_id, tenant_id } = body;

  if (!message?.trim() || !tenant_id) {
    return new Response(
      JSON.stringify({ error: "message and tenant_id are required" }),
      { status: 400 },
    );
  }

  // Limit message length to prevent abuse (10,000 chars ≈ 2,500 tokens)
  if (message.length > 10000) {
    return new Response(
      JSON.stringify({ error: "Message too long (max 10,000 characters)" }),
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Verify ownership
  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .select("*")
    .eq("id", tenant_id)
    .eq("owner_id", user.id)
    .single();

  if (tenantError || !tenant) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  }

  const typedTenant = tenant as Tenant;

  // Session management
  let currentSessionId = session_id;

  if (!currentSessionId) {
    // Create new session with title from first message
    const title =
      message.trim().length > 50
        ? message.trim().slice(0, 50) + "..."
        : message.trim();

    const { data: newSession, error: sessionError } = await admin
      .from("ai_chat_sessions")
      .insert({ tenant_id, title })
      .select("id")
      .single();

    if (sessionError || !newSession) {
      return new Response(
        JSON.stringify({ error: "Failed to create session" }),
        { status: 500 },
      );
    }
    currentSessionId = newSession.id;
  } else {
    // Verify session belongs to tenant
    const { data: existingSession } = await admin
      .from("ai_chat_sessions")
      .select("id")
      .eq("id", currentSessionId)
      .eq("tenant_id", tenant_id)
      .single();

    if (!existingSession) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
      });
    }

    // Update session timestamp
    await admin
      .from("ai_chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", currentSessionId);
  }

  // Load conversation history BEFORE inserting user message to avoid race condition
  const { data: historyMessages } = await admin
    .from("ai_chat_messages")
    .select("role, content")
    .eq("session_id", currentSessionId)
    .order("created_at", { ascending: true })
    .limit(20);

  // Save user message
  await admin.from("ai_chat_messages").insert({
    session_id: currentSessionId,
    tenant_id,
    role: "user",
    content: message.trim(),
    sources: [],
  });

  // Load all business context in parallel
  const sourcesUsed: { type: string; label: string; count: number }[] = [];

  const [
    productsRes,
    zonesRes,
    faqsRes,
    ordersRes,
    ordersCountRes,
    conversationsRes,
    activeConvsRes,
    entriesRes,
    docsRes,
    instructionRes,
    rulesRes,
  ] = await Promise.all([
    admin
      .from("products")
      .select("*")
      .eq("tenant_id", tenant_id)
      .eq("is_active", true),
    admin
      .from("delivery_zones")
      .select("*")
      .eq("tenant_id", tenant_id)
      .eq("is_active", true),
    admin.from("faqs").select("*").eq("tenant_id", tenant_id),
    admin
      .from("orders")
      .select("*")
      .eq("tenant_id", tenant_id)
      .order("created_at", { ascending: false })
      .limit(10),
    admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant_id),
    admin
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant_id),
    admin
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant_id)
      .eq("status", "active"),
    admin
      .from("knowledge_entries")
      .select("*")
      .eq("tenant_id", tenant_id)
      .eq("is_active", true),
    admin
      .from("knowledge_documents")
      .select("*")
      .eq("tenant_id", tenant_id)
      .eq("status", "ready"),
    admin
      .from("bot_instructions")
      .select("*")
      .eq("tenant_id", tenant_id)
      .maybeSingle(),
    admin
      .from("behavior_rules")
      .select("*")
      .eq("tenant_id", tenant_id)
      .eq("is_enabled", true),
  ]);

  // Track sources
  if (productsRes.data?.length) {
    sourcesUsed.push({
      type: "products",
      label: "პროდუქტები",
      count: productsRes.data.length,
    });
  }
  if (ordersCountRes.count) {
    sourcesUsed.push({
      type: "orders",
      label: "შეკვეთები",
      count: ordersCountRes.count,
    });
  }
  if (conversationsRes.count) {
    sourcesUsed.push({
      type: "conversations",
      label: "საუბრები",
      count: conversationsRes.count,
    });
  }
  if (zonesRes.data?.length) {
    sourcesUsed.push({
      type: "delivery_zones",
      label: "მიწოდება",
      count: zonesRes.data.length,
    });
  }
  if (faqsRes.data?.length) {
    sourcesUsed.push({
      type: "faqs",
      label: "FAQ",
      count: faqsRes.data.length,
    });
  }
  if (entriesRes.data?.length) {
    sourcesUsed.push({
      type: "knowledge",
      label: "ცოდნის ბაზა",
      count: entriesRes.data.length,
    });
  }
  if (docsRes.data?.length) {
    sourcesUsed.push({
      type: "documents",
      label: "დოკუმენტები",
      count: docsRes.data.length,
    });
  }

  // Build system prompt
  const systemPrompt = buildOwnerChatPrompt({
    tenant: typedTenant,
    products: productsRes.data || [],
    deliveryZones: zonesRes.data || [],
    faqs: faqsRes.data || [],
    orders: {
      count: ordersCountRes.count || 0,
      recent: ordersRes.data || [],
    },
    conversations: {
      count: conversationsRes.count || 0,
      active: activeConvsRes.count || 0,
    },
    knowledgeEntries: (entriesRes.data as KnowledgeEntry[]) || [],
    knowledgeDocuments: (docsRes.data as KnowledgeDocument[]) || [],
    botInstruction: instructionRes.data as BotInstruction | null,
    behaviorRules: (rulesRes.data as BehaviorRule[]) || [],
  });

  // Build conversation history for Gemini (queried before insert, so no need to exclude)
  const rawHistory = historyMessages || [];
  const conversationHistory: Content[] = [];
  for (const m of rawHistory) {
    const role = m.role === "user" ? ("user" as const) : ("model" as const);
    const lastEntry = conversationHistory[conversationHistory.length - 1];
    // Gemini requires alternating user/model — merge consecutive same-role messages
    if (lastEntry && lastEntry.role === role) {
      lastEntry.parts.push({ text: m.content });
    } else {
      conversationHistory.push({ role, parts: [{ text: m.content }] });
    }
  }
  // Gemini requires conversation to start with "user" role — drop leading model messages
  while (
    conversationHistory.length > 0 &&
    conversationHistory[0].role === "model"
  ) {
    conversationHistory.shift();
  }

  // Call Gemini with streaming
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
      { status: 500 },
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt,
  });

  const contents: Content[] = [
    ...conversationHistory,
    { role: "user", parts: [{ text: message.trim() }] },
  ];

  const encoder = new TextEncoder();
  let fullResponse = "";
  let cancelled = false;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await model.generateContentStream({ contents });

        for await (const chunk of result.stream) {
          if (cancelled) break;
          const text = chunk.text();
          if (text) {
            fullResponse += text;
            if (cancelled) break;
            try {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ text, done: false })}\n\n`,
                ),
              );
            } catch {
              // Controller closed (client disconnected) — stop streaming
              break;
            }
          }
        }

        if (cancelled) {
          // Save partial response if client disconnected mid-stream
          if (fullResponse) {
            await admin.from("ai_chat_messages").insert({
              session_id: currentSessionId,
              tenant_id,
              role: "assistant",
              content: fullResponse,
              sources: sourcesUsed,
            });
          }
          return;
        }

        // Send final chunk with metadata
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              text: "",
              done: true,
              sources: sourcesUsed,
              session_id: currentSessionId,
            })}\n\n`,
          ),
        );

        // Save assistant message to database
        await admin.from("ai_chat_messages").insert({
          session_id: currentSessionId,
          tenant_id,
          role: "assistant",
          content: fullResponse,
          sources: sourcesUsed,
        });

        controller.close();
      } catch (error) {
        if (cancelled) return;
        console.error("Gemini streaming error:", error);
        const errorText =
          "ბოდიში, ტექნიკური შეფერხება მოხდა. გთხოვთ სცადოთ თავიდან.";
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ text: errorText, done: true, error: true, sources: [], session_id: currentSessionId })}\n\n`,
            ),
          );
          controller.close();
        } catch {
          // Controller already closed
        }

        // Save error response
        await admin.from("ai_chat_messages").insert({
          session_id: currentSessionId,
          tenant_id,
          role: "assistant",
          content: errorText,
          sources: [],
        });
      }
    },
    cancel() {
      cancelled = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
