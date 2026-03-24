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
  KnowledgeSource,
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
    webSearchEnabled?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
    });
  }

  const { message, session_id, tenant_id, webSearchEnabled } = body;

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
    adMetricsRes,
    adCampaignsRes,
    adRecsRes,
    knowledgeSourcesRes,
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
    // Ads data (last 30 days metrics for Premium tenants)
    typedTenant.subscription_plan === "premium"
      ? admin
          .from("ad_metrics")
          .select(
            "spend, impressions, clicks, conversions, ctr, cpc, roas, campaign_id",
          )
          .eq("tenant_id", tenant_id)
          .is("adset_id", null)
          .is("ad_id", null)
          .gte(
            "date",
            new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
          )
      : Promise.resolve({ data: null }),
    typedTenant.subscription_plan === "premium"
      ? admin.from("ad_campaigns").select("id, name").eq("tenant_id", tenant_id)
      : Promise.resolve({ data: null }),
    typedTenant.subscription_plan === "premium"
      ? admin
          .from("ad_recommendations")
          .select("priority, category, description")
          .eq("tenant_id", tenant_id)
          .order("generated_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: null }),
    admin.from("knowledge_sources").select("*").eq("tenant_id", tenant_id),
  ]);

  // Determine which sources are enabled via knowledge base toggles
  const knowledgeSources =
    (knowledgeSourcesRes.data as KnowledgeSource[]) || [];
  const enabledSourceTypes = new Set(
    knowledgeSources.filter((s) => s.is_enabled).map((s) => s.source_type),
  );
  const noSourcesConfigured = knowledgeSources.length === 0;

  const includeProducts =
    noSourcesConfigured || enabledSourceTypes.has("products");
  const includeOrders = noSourcesConfigured || enabledSourceTypes.has("orders");
  const includeConversations =
    noSourcesConfigured || enabledSourceTypes.has("conversations");
  const includeZones =
    noSourcesConfigured || enabledSourceTypes.has("delivery_zones");
  const includeFaqs = noSourcesConfigured || enabledSourceTypes.has("faqs");
  const includeAds = noSourcesConfigured || enabledSourceTypes.has("ads");

  // Track sources (only if enabled)
  if (includeProducts && productsRes.data?.length) {
    sourcesUsed.push({
      type: "products",
      label: "პროდუქტები",
      count: productsRes.data.length,
    });
  }
  if (includeOrders && ordersCountRes.count) {
    sourcesUsed.push({
      type: "orders",
      label: "შეკვეთები",
      count: ordersCountRes.count,
    });
  }
  if (includeConversations && conversationsRes.count) {
    sourcesUsed.push({
      type: "conversations",
      label: "საუბრები",
      count: conversationsRes.count,
    });
  }
  if (includeZones && zonesRes.data?.length) {
    sourcesUsed.push({
      type: "delivery_zones",
      label: "მიწოდება",
      count: zonesRes.data.length,
    });
  }
  if (includeFaqs && faqsRes.data?.length) {
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

  // ─── Build ads summary for prompt ──────────────────────────
  let adsSummary = null;
  if (includeAds && adMetricsRes.data?.length && adCampaignsRes.data?.length) {
    const metricsData = adMetricsRes.data as Array<{
      spend: number;
      impressions: number;
      clicks: number;
      conversions: number;
      ctr: number;
      cpc: number;
      roas: number;
      campaign_id: string;
    }>;
    const campaignNames = new Map(
      (adCampaignsRes.data as Array<{ id: string; name: string }>).map((c) => [
        c.id,
        c.name,
      ]),
    );

    const totalSpend = metricsData.reduce((s, m) => s + (m.spend || 0), 0);
    const totalImpressions = metricsData.reduce(
      (s, m) => s + (m.impressions || 0),
      0,
    );
    const totalClicks = metricsData.reduce((s, m) => s + (m.clicks || 0), 0);
    const totalConversions = metricsData.reduce(
      (s, m) => s + (m.conversions || 0),
      0,
    );

    // Aggregate per campaign
    const byCampaign: Record<
      string,
      { spend: number; roas: number; count: number }
    > = {};
    for (const m of metricsData) {
      if (!m.campaign_id) continue;
      if (!byCampaign[m.campaign_id]) {
        byCampaign[m.campaign_id] = { spend: 0, roas: 0, count: 0 };
      }
      byCampaign[m.campaign_id].spend += m.spend || 0;
      byCampaign[m.campaign_id].roas += m.roas || 0;
      byCampaign[m.campaign_id].count += 1;
    }

    const topCampaigns = Object.entries(byCampaign)
      .map(([id, data]) => ({
        name: campaignNames.get(id) || "Unknown",
        spend: data.spend,
        roas: data.count > 0 ? data.roas / data.count : 0,
      }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5);

    adsSummary = {
      totalSpend,
      totalImpressions,
      totalClicks,
      totalConversions,
      avgCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      avgCpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      topCampaigns,
      recommendations: (adRecsRes.data || []) as Array<{
        priority: string;
        category: string;
        description: string;
      }>,
    };

    sourcesUsed.push({
      type: "ads",
      label: "რეკლამები",
      count: metricsData.length,
    });
  }

  // ─── Web search quota check ───────────────────────────────
  let useWebSearch = false;
  let webSearchQuotaWarning: string | null = null;

  if (webSearchEnabled) {
    // Use the authenticated supabase client (not admin) because the RPC
    // is SECURITY DEFINER and checks auth.uid() internally to prevent spoofing
    const { data: quotaResult } = await supabase.rpc(
      "increment_web_search_usage",
      { p_tenant_id: tenant_id },
    );

    if (quotaResult && quotaResult.allowed) {
      useWebSearch = true;
    } else {
      webSearchQuotaWarning = "ვებ ძიების თვიური ლიმიტი ამოიწურა";
    }
  }

  // Build system prompt — only include data from enabled knowledge sources
  const systemPrompt = buildOwnerChatPrompt({
    tenant: typedTenant,
    products: includeProducts ? productsRes.data || [] : [],
    deliveryZones: includeZones ? zonesRes.data || [] : [],
    faqs: includeFaqs ? faqsRes.data || [] : [],
    orders: includeOrders
      ? { count: ordersCountRes.count || 0, recent: ordersRes.data || [] }
      : { count: 0, recent: [] },
    conversations: includeConversations
      ? {
          count: conversationsRes.count || 0,
          active: activeConvsRes.count || 0,
        }
      : { count: 0, active: 0 },
    knowledgeEntries: (entriesRes.data as KnowledgeEntry[]) || [],
    knowledgeDocuments: (docsRes.data as KnowledgeDocument[]) || [],
    botInstruction: instructionRes.data as BotInstruction | null,
    behaviorRules: (rulesRes.data as BehaviorRule[]) || [],
    adsSummary,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modelConfig: any = {
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt,
  };

  if (useWebSearch) {
    // Gemini 2.x+ models use 'googleSearch' (not the deprecated 'googleSearchRetrieval')
    modelConfig.tools = [{ googleSearch: {} }];
  }

  const model = genAI.getGenerativeModel(modelConfig);

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
        // Send quota warning if web search was requested but denied
        if (webSearchQuotaWarning) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "quota_warning", message: webSearchQuotaWarning })}\n\n`,
            ),
          );
        }

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
              used_web_search: useWebSearch,
            });
          }
          return;
        }

        // Extract grounding metadata for web search sources
        let webSources: { type: string; title: string; url: string }[] = [];
        if (useWebSearch) {
          try {
            const aggregated = await result.response;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const groundingMeta = (aggregated.candidates?.[0] as any)
              ?.groundingMetadata;
            // Handle both correct spelling and SDK v0.21 typo
            const chunks =
              groundingMeta?.groundingChunks ?? groundingMeta?.groundingChuncks;
            if (chunks && chunks.length > 0) {
              webSources = chunks
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .filter((chunk: any) => chunk.web?.uri)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((chunk: any) => ({
                  type: "web" as const,
                  title: chunk.web?.title || chunk.web?.uri || "Source",
                  url: chunk.web!.uri!,
                }));
              // Deduplicate by URL
              const seen = new Set<string>();
              webSources = webSources.filter((s) => {
                if (seen.has(s.url)) return false;
                seen.add(s.url);
                return true;
              });
            }
          } catch {
            // Grounding metadata extraction failed — continue without sources
          }
        }

        // Combine business sources with web sources
        const allSources = [...sourcesUsed, ...webSources];

        // Send final chunk with metadata
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              text: "",
              done: true,
              sources: allSources,
              session_id: currentSessionId,
              used_web_search: useWebSearch,
            })}\n\n`,
          ),
        );

        // Save assistant message to database
        await admin.from("ai_chat_messages").insert({
          session_id: currentSessionId,
          tenant_id,
          role: "assistant",
          content: fullResponse,
          sources: allSources,
          used_web_search: useWebSearch,
        });

        controller.close();
      } catch (error) {
        if (cancelled) return;
        console.error("Gemini streaming error:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          useWebSearch,
        });
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
