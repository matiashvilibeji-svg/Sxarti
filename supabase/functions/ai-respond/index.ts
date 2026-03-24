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
      .select("bot_persona_name, bot_tone, business_name")
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

    const toneMap = {
      formal: "ფორმალური და პროფესიონალური",
      friendly: "მეგობრული და თბილი",
      casual: "არაფორმალური და მარტივი",
    };

    const systemPrompt = `შენ ხარ "${tenant?.bot_persona_name || "ასისტენტი"}" — AI გაყიდვების ასისტენტი "${tenant?.business_name || ""}" კომპანიისთვის.
ტონი: ${toneMap[tenant?.bot_tone as keyof typeof toneMap] || toneMap.friendly}

ხელმისაწვდომი პროდუქცია:
${(products || []).map((p) => `- ${p.name}: ${p.price} ₾ (მარაგი: ${p.stock_quantity})`).join("\n")}

მიტანის ზონები და ტარიფები:
${(deliveryZones || []).map((z) => `- ${z.zone_name}: ${z.fee} ₾ (სავარაუდო ვადა: ${z.estimated_days || "არ არის მითითებული"})`).join("\n")}

წესები:
- უპასუხე მხოლოდ ქართულ ენაზე
- დაეხმარე მომხმარებელს პროდუქციის არჩევაში
- თუ მომხმარებელი მზად არის შესაკვეთად, შეაგროვე: სახელი, ტელეფონი, მისამართი
- თუ მომხმარებელი იკითხავს მიტანის ფასს ან ვადას, მიაწოდე ზუსტი ინფორმაცია მიტანის ზონებიდან
- თუ მომხმარებლის ადგილმდებარეობა არ ემთხვევა არცერთ ზონას, შეატყობინე რომ მიტანა მხოლოდ ჩამოთვლილ ზონებშია ხელმისაწვდომი
- თუ ვერ პასუხობ კითხვას, თავაზიანად გადამისამართე ოპერატორთან`;

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
