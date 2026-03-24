import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSystemPrompt } from "@/lib/ai/prompts/system";
import { generateBotResponse } from "@/lib/ai/gemini";
import type {
  Tenant,
  KnowledgeEntry,
  KnowledgeDocument,
  BotInstruction,
  BehaviorRule,
  KnowledgeSource,
} from "@/types/database";

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    message: string;
    tenant_id: string;
    history?: { role: "user" | "bot"; content: string }[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message, tenant_id, history = [] } = body;
  if (!message?.trim() || !tenant_id) {
    return NextResponse.json(
      { error: "message and tenant_id are required" },
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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const typedTenant = tenant as Tenant;

  // Load all knowledge context in parallel
  const [
    productsRes,
    zonesRes,
    faqsRes,
    sourcesRes,
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
    admin.from("knowledge_sources").select("*").eq("tenant_id", tenant_id),
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

  const knowledgeSources = (sourcesRes.data as KnowledgeSource[]) || [];
  const enabledSourceTypes = new Set(
    knowledgeSources.filter((s) => s.is_enabled).map((s) => s.source_type),
  );
  const noSourcesConfigured = knowledgeSources.length === 0;

  // Track which sources are used
  const sourcesUsed: string[] = [];

  // Build system prompt with test context (no conversation state)
  const includeProducts =
    noSourcesConfigured || enabledSourceTypes.has("products");
  const includeZones =
    noSourcesConfigured || enabledSourceTypes.has("delivery_zones");
  const includeFaqs = noSourcesConfigured || enabledSourceTypes.has("faqs");

  const systemPrompt = buildSystemPrompt({
    tenant: typedTenant,
    products: includeProducts ? productsRes.data || [] : [],
    deliveryZones: includeZones ? zonesRes.data || [] : [],
    faqs: includeFaqs ? faqsRes.data || [] : [],
    conversation: {
      id: "test",
      tenant_id,
      platform: "messenger",
      platform_user_id: "test",
      customer_name: null,
      status: "active",
      current_stage: "greeting",
      cart: [],
      customer_info: null,
      ai_context: null,
      handoff_reason: null,
      handed_off_at: null,
      started_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
    },
    knowledgeEntries: (entriesRes.data as KnowledgeEntry[]) || [],
    knowledgeDocuments: (docsRes.data as KnowledgeDocument[]) || [],
    botInstruction: instructionRes.data as BotInstruction | null,
    behaviorRules: (rulesRes.data as BehaviorRule[]) || [],
  });

  // Track sources
  if (includeProducts && productsRes.data?.length)
    sourcesUsed.push("პროდუქტები");
  if (includeZones && zonesRes.data?.length) sourcesUsed.push("მიწოდება");
  if (includeFaqs && faqsRes.data?.length) sourcesUsed.push("FAQ");
  if (entriesRes.data?.length) sourcesUsed.push("სპეციალური ცოდნა");
  if (docsRes.data?.length) sourcesUsed.push("დოკუმენტები");
  if (instructionRes.data) sourcesUsed.push("ინსტრუქციები");

  try {
    // Convert chat history to the format expected by generateBotResponse
    const conversationHistory = history.map((h) => ({
      role: h.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: h.content }],
    }));
    const result = await generateBotResponse(
      systemPrompt,
      conversationHistory,
      message.trim(),
    );
    return NextResponse.json({
      response: result.message,
      sources_used: sourcesUsed,
    });
  } catch (error) {
    console.error("Test chat error:", error);
    return NextResponse.json({
      response:
        "ტესტის შეცდომა — AI სერვისთან კავშირი ვერ მოხერხდა. გთხოვთ შეამოწმეთ GEMINI_API_KEY.",
      sources_used: [],
    });
  }
}
