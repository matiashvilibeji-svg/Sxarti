import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { conversation_id, tenant_id, message } = await req.json();

    if (!conversation_id || !tenant_id || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Load conversation context
    const { data: messages } = await supabase
      .from("messages")
      .select("sender, content")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true })
      .limit(20);

    // Load tenant config for bot persona
    const { data: tenant } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", tenant_id)
      .single();

    // Load products for context
    const { data: products } = await supabase
      .from("products")
      .select("name, price, description, stock_quantity, is_active")
      .eq("tenant_id", tenant_id)
      .eq("is_active", true);

    // Load delivery zones for context
    const { data: deliveryZones } = await supabase
      .from("delivery_zones")
      .select("zone_name, fee, estimated_days, is_active")
      .eq("tenant_id", tenant_id)
      .eq("is_active", true);

    // Load AI Assistant knowledge config
    const [
      knowledgeSourcesRes,
      knowledgeEntriesRes,
      knowledgeDocsRes,
      botInstructionRes,
      behaviorRulesRes,
      adCampaignsRes,
      adMetricsRes,
    ] = await Promise.all([
      supabase.from("knowledge_sources").select("*").eq("tenant_id", tenant_id),
      supabase
        .from("knowledge_entries")
        .select("*")
        .eq("tenant_id", tenant_id)
        .eq("is_active", true),
      supabase
        .from("knowledge_documents")
        .select("*")
        .eq("tenant_id", tenant_id)
        .eq("status", "ready"),
      supabase
        .from("bot_instructions")
        .select("*")
        .eq("tenant_id", tenant_id)
        .maybeSingle(),
      supabase
        .from("behavior_rules")
        .select("*")
        .eq("tenant_id", tenant_id)
        .eq("is_enabled", true),
      supabase.from("ad_campaigns").select("*").eq("tenant_id", tenant_id),
      supabase
        .from("ad_metrics")
        .select("*")
        .eq("tenant_id", tenant_id)
        .order("date", { ascending: false })
        .limit(50),
    ]);

    const toneMap = {
      formal: "ფორმალური და პროფესიონალური",
      friendly: "მეგობრული და თბილი",
      casual: "არაფორმალური და მარტივი",
    };

    // Build personality settings
    const responseLength = tenant?.bot_response_length ?? 50;
    const lengthGuide =
      responseLength < 33
        ? "მოკლე და ლაკონური"
        : responseLength < 66
          ? "საშუალო სიგრძის"
          : "დეტალური და ვრცელი";
    const emojiUsage = tenant?.bot_emoji_usage ?? 50;
    const emojiGuide =
      emojiUsage < 33
        ? "არ გამოიყენო ემოჯი"
        : emojiUsage < 66
          ? "ზომიერად გამოიყენე ემოჯი"
          : "აქტიურად გამოიყენე ემოჯი";
    const salesAgg = tenant?.bot_sales_aggressiveness ?? 30;
    const salesGuide =
      salesAgg < 33
        ? "ნუ იქნები აგრესიული გაყიდვებში"
        : salesAgg < 66
          ? "ზომიერად შესთავაზე პროდუქტები"
          : "აქტიურად წარმართე გაყიდვისკენ";

    // Custom knowledge sections
    const knowledgeEntries = knowledgeEntriesRes.data || [];
    const knowledgeDocs = knowledgeDocsRes.data || [];
    const botInstruction = botInstructionRes.data;
    const behaviorRules = behaviorRulesRes.data || [];

    let customKnowledge = "";
    if (botInstruction?.main_instruction) {
      customKnowledge += `\n\nმთავარი ინსტრუქცია:\n${botInstruction.main_instruction}`;
    }
    if (behaviorRules.length > 0) {
      customKnowledge += `\n\nქცევის წესები:\n${behaviorRules.map((r: { rule_text: string }) => `- ${r.rule_text}`).join("\n")}`;
    }
    if (knowledgeEntries.length > 0) {
      customKnowledge += `\n\nსპეციალური ცოდნა:\n${knowledgeEntries.map((e: { title: string; content: string }) => `### ${e.title}\n${e.content}`).join("\n\n")}`;
    }
    if (knowledgeDocs.length > 0) {
      const docTexts = knowledgeDocs
        .filter((d: { extracted_text: string | null }) => d.extracted_text)
        .map(
          (d: { file_name: string; extracted_text: string }) =>
            `### ${d.file_name}\n${d.extracted_text}`,
        )
        .join("\n\n");
      if (docTexts) customKnowledge += `\n\nდოკუმენტებიდან:\n${docTexts}`;
    }

    // Determine which sources are enabled
    const knowledgeSources = knowledgeSourcesRes.data || [];
    const enabledTypes = new Set(
      knowledgeSources
        .filter((s: { is_enabled: boolean }) => s.is_enabled)
        .map((s: { source_type: string }) => s.source_type),
    );
    // If no sources configured yet, default to all enabled
    const noSourcesConfigured = knowledgeSources.length === 0;
    const includeProducts = noSourcesConfigured || enabledTypes.has("products");
    const includeZones =
      noSourcesConfigured || enabledTypes.has("delivery_zones");
    const includeAds = noSourcesConfigured || enabledTypes.has("ads");

    const filteredProducts = includeProducts ? products || [] : [];
    const filteredZones = includeZones ? deliveryZones || [] : [];

    const systemPrompt = `შენ ხარ "${tenant?.bot_persona_name || "ასისტენტი"}" — AI გაყიდვების ასისტენტი "${tenant?.business_name || ""}" კომპანიისთვის.
ტონი: ${toneMap[tenant?.bot_tone as keyof typeof toneMap] || toneMap.friendly}
პასუხის სტილი: ${lengthGuide}
ემოჯი: ${emojiGuide}
გაყიდვების მიდგომა: ${salesGuide}${tenant?.bot_greeting_message ? `\nმისალმება: "${tenant.bot_greeting_message}"` : ""}

ხელმისაწვდომი პროდუქცია:
${filteredProducts.map((p) => `- ${p.name}: ${p.price} ₾ (მარაგი: ${p.stock_quantity})`).join("\n") || "პროდუქტები გამორთულია"}

მიტანის ზონები და ტარიფები:
${filteredZones.map((z) => `- ${z.zone_name}: ${z.fee} ₾ (სავარაუდო ვადა: ${z.estimated_days || "არ არის მითითებული"})`).join("\n") || "მიწოდების ინფორმაცია გამორთულია"}

წესები:
- უპასუხე მხოლოდ ქართულ ენაზე
- დაეხმარე მომხმარებელს პროდუქციის არჩევაში
- თუ მომხმარებელი მზად არის შესაკვეთად, შეაგროვე: სახელი, ტელეფონი, მისამართი
- თუ მომხმარებელი იკითხავს მიტანის ფასს ან ვადას, მიაწოდე ზუსტი ინფორმაცია მიტანის ზონებიდან
- თუ მომხმარებლის ადგილმდებარეობა არ ემთხვევა არცერთ ზონას, შეატყობინე რომ მიტანა მხოლოდ ჩამოთვლილ ზონებშია ხელმისაწვდომი
- თუ ვერ პასუხობ კითხვას, თავაზიანად გადამისამართე ოპერატორთან${customKnowledge}${(() => {
      if (!includeAds) return "";
      const campaigns = adCampaignsRes.data || [];
      if (campaigns.length === 0) return "";
      const metrics = adMetricsRes.data || [];
      const activeCampaigns = campaigns.filter(
        (c: { status: string }) => c.status === "ACTIVE",
      );
      const campaignLines = campaigns.map(
        (c: {
          id: string;
          name: string;
          status: string;
          objective: string | null;
          daily_budget: number | null;
          lifetime_budget: number | null;
        }) => {
          const budget = c.daily_budget
            ? `${c.daily_budget} ₾/დღე`
            : c.lifetime_budget
              ? `${c.lifetime_budget} ₾ სულ`
              : "ბიუჯეტი არ არის";
          const campMetrics = metrics.filter(
            (m: { campaign_id: string }) => m.campaign_id === c.id,
          );
          let perfLine = "";
          if (campMetrics.length > 0) {
            const totalSpend = campMetrics.reduce(
              (s: number, m: { spend: number }) => s + m.spend,
              0,
            );
            const totalClicks = campMetrics.reduce(
              (s: number, m: { clicks: number }) => s + m.clicks,
              0,
            );
            const totalImpressions = campMetrics.reduce(
              (s: number, m: { impressions: number }) => s + m.impressions,
              0,
            );
            const avgCtr =
              totalImpressions > 0
                ? ((totalClicks / totalImpressions) * 100).toFixed(2)
                : "0";
            perfLine = ` | ხარჯი: ${totalSpend.toFixed(2)} ₾, კლიკები: ${totalClicks}, CTR: ${avgCtr}%`;
          }
          return `- ${c.name} (${c.status}) — ${c.objective || "მიზანი არ არის"} | ${budget}${perfLine}`;
        },
      );
      return `\n\nაქტიური რეკლამები:\nაქტიური კამპანიები: ${activeCampaigns.length}/${campaigns.length}\n${campaignLines.join("\n")}\n\nთუ მომხმარებელი რეკლამით მოვიდა, შეგიძლია ახსენო მიმდინარე აქცია ან შეთავაზება.`;
    })()}`;

    const conversationHistory = (messages || []).map((m) => ({
      role: m.sender === "customer" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    // Call Gemini API
    const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!geminiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [
            ...conversationHistory,
            { role: "user", parts: [{ text: message }] },
          ],
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      return new Response(
        JSON.stringify({ error: `Gemini error: ${errText}` }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const geminiData = await geminiResponse.json();
    const aiReply =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
      "ბოდიშს ვიხდი, ვერ დავამუშავე თქვენი შეტყობინება.";

    // Store AI response in messages table
    await supabase.from("messages").insert({
      conversation_id,
      tenant_id,
      sender: "bot",
      content: aiReply,
    });

    return new Response(JSON.stringify({ reply: aiReply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
