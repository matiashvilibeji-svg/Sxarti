import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toGeorgianDateKey } from "@/lib/utils/georgian-time";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { tenant_id: string; date_from: string; date_to: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tenant_id, date_from, date_to } = body;
  if (!tenant_id || !date_from || !date_to) {
    return NextResponse.json(
      { error: "tenant_id, date_from, and date_to are required" },
      { status: 400 },
    );
  }

  // Verify tenant ownership + premium
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, subscription_plan, business_name")
    .eq("id", tenant_id)
    .eq("owner_id", user.id)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // NOTE: premium gate temporarily disabled — all plans can access recommendations
  // if (tenant.subscription_plan !== "premium") {
  //   return NextResponse.json(
  //     { error: "Premium subscription required" },
  //     { status: 403 },
  //   );
  // }

  const admin = createAdminClient();

  // Gather data for AI analysis
  const [campaignsRes, metricsRes, conversationsRes, messagesRes] =
    await Promise.all([
      admin
        .from("ad_campaigns")
        .select("id, name, status, daily_budget, lifetime_budget")
        .eq("tenant_id", tenant_id),
      admin
        .from("ad_metrics")
        .select("*")
        .eq("tenant_id", tenant_id)
        .gte("date", date_from)
        .lte("date", date_to)
        .is("adset_id", null)
        .is("ad_id", null),
      admin
        .from("conversations")
        .select("id, started_at, platform, status")
        .eq("tenant_id", tenant_id)
        .gte("started_at", date_from)
        .lte("started_at", date_to + "T23:59:59Z"),
      admin
        .from("messages")
        .select("content, created_at")
        .eq("tenant_id", tenant_id)
        .eq("sender", "customer")
        .gte("created_at", date_from)
        .lte("created_at", date_to + "T23:59:59Z")
        .limit(500),
    ]);

  const campaigns = campaignsRes.data ?? [];
  const metrics = metricsRes.data ?? [];
  const conversations = conversationsRes.data ?? [];
  const messages = messagesRes.data ?? [];

  // Build campaign performance summary
  const campaignSummary = campaigns.map((c) => {
    const campaignMetrics = metrics.filter((m) => m.campaign_id === c.id);
    const totalSpend = campaignMetrics.reduce(
      (sum, m) => sum + (m.spend || 0),
      0,
    );
    const totalClicks = campaignMetrics.reduce(
      (sum, m) => sum + (m.clicks || 0),
      0,
    );
    const totalImpressions = campaignMetrics.reduce(
      (sum, m) => sum + (m.impressions || 0),
      0,
    );
    const totalConversions = campaignMetrics.reduce(
      (sum, m) => sum + (m.conversions || 0),
      0,
    );
    const avgRoas =
      campaignMetrics.length > 0
        ? campaignMetrics.reduce((sum, m) => sum + (m.roas || 0), 0) /
          campaignMetrics.length
        : 0;

    return {
      name: c.name,
      status: c.status,
      budget: c.daily_budget || c.lifetime_budget || 0,
      spend: totalSpend,
      clicks: totalClicks,
      impressions: totalImpressions,
      conversions: totalConversions,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      roas: avgRoas,
    };
  });

  // Conversation volume by date
  const convByDate: Record<string, number> = {};
  for (const c of conversations) {
    const date = toGeorgianDateKey(c.started_at);
    convByDate[date] = (convByDate[date] || 0) + 1;
  }

  // Extract product mentions from messages
  const productMentions: Record<string, number> = {};
  const { data: products } = await admin
    .from("products")
    .select("name")
    .eq("tenant_id", tenant_id)
    .eq("is_active", true);

  if (products) {
    for (const msg of messages) {
      const content = msg.content.toLowerCase();
      for (const p of products) {
        if (content.includes(p.name.toLowerCase())) {
          productMentions[p.name] = (productMentions[p.name] || 0) + 1;
        }
      }
    }
  }

  // Conversation peak hours
  const hourCounts: Record<number, number> = {};
  for (const c of conversations) {
    const hour = new Date(c.started_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  }

  // Build Gemini prompt
  const prompt = `შენ ხარ რეკლამების ანალიტიკოსი ქართული ბიზნესისთვის "${tenant.business_name}".

გაანალიზე შემდეგი მონაცემები და გამოიტანე რეკომენდაციები ქართულად.

## კამპანიების შედეგები (${date_from} - ${date_to}):
${JSON.stringify(campaignSummary, null, 2)}

## საუბრების რაოდენობა თარიღებისთვის:
${JSON.stringify(convByDate, null, 2)}

## მომხმარებლების მიერ ნახსენები პროდუქტები საუბრებში:
${JSON.stringify(productMentions, null, 2)}

## საუბრების პიკური საათები:
${JSON.stringify(hourCounts, null, 2)}

## სულ საუბრები პერიოდში: ${conversations.length}

გამოიტანე 3-5 რეკომენდაცია JSON ფორმატში. თითოეულ რეკომენდაციას უნდა ჰქონდეს:
- priority: "high", "medium", ან "low"
- category: "budget", "creative", "audience", "timing", ან "product"
- title: მოკლე სათაური ქართულად
- description: 2-3 წინადადება ქართულად, კონკრეტული რჩევით
- supporting_data: მხარდამჭერი მონაცემები (რიცხვები, პროცენტები)

გაითვალისწინე:
1. ბიუჯეტის გადანაწილება: მაღალ-ROAS კამპანიებზე მეტი ბიუჯეტი
2. პროდუქტი-რეკლამა შეუსაბამობა: პროდუქტები რომლებზეც კითხულობენ, მაგრამ რეკლამა არ აქვთ
3. დროის ოპტიმიზაცია: რეკლამის გრაფიკი საუბრების პიკურ საათებთან
4. აუდიტორიის გაფართოება: მზარდი სეგმენტები

უპასუხე მხოლოდ JSON მასივით, სხვა ტექსტის გარეშე:
[{"priority":"...","category":"...","title":"...","description":"...","supporting_data":{...}}]`;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 },
      );
    }

    const recommendations = JSON.parse(jsonMatch[0]);

    // Clear old recommendations and insert new
    await admin.from("ad_recommendations").delete().eq("tenant_id", tenant_id);

    const rows = recommendations.map(
      (r: {
        priority: string;
        category: string;
        title: string;
        description: string;
        supporting_data: Record<string, unknown>;
      }) => ({
        tenant_id,
        priority: r.priority,
        category: r.category,
        title: r.title,
        description: r.description,
        supporting_data: r.supporting_data,
      }),
    );

    await admin.from("ad_recommendations").insert(rows);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("AI recommendation generation failed:", error);
    return NextResponse.json(
      {
        error: "Failed to generate recommendations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
