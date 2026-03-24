import type {
  Tenant,
  Product,
  DeliveryZone,
  FAQ,
  KnowledgeEntry,
  KnowledgeDocument,
  BotInstruction,
  BehaviorRule,
} from "@/types/database";
import { formatGEL } from "@/lib/utils/currency";

/** Escape markdown control characters to prevent prompt structure injection */
function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/[#*_`>[\]]/g, (c) => `\\${c}`);
}

interface AdsSummary {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgCtr: number;
  avgCpc: number;
  topCampaigns: { name: string; spend: number; roas: number }[];
  recommendations: {
    priority: string;
    category: string;
    description: string;
  }[];
}

interface OwnerChatPromptInput {
  tenant: Tenant;
  products: Product[];
  deliveryZones: DeliveryZone[];
  faqs: FAQ[];
  orders: { count: number; recent: Array<Record<string, unknown>> };
  conversations: { count: number; active: number };
  knowledgeEntries: KnowledgeEntry[];
  knowledgeDocuments: KnowledgeDocument[];
  botInstruction: BotInstruction | null;
  behaviorRules: BehaviorRule[];
  adsSummary?: AdsSummary | null;
}

export function buildOwnerChatPrompt({
  tenant,
  products,
  deliveryZones,
  faqs,
  orders,
  conversations,
  knowledgeEntries,
  knowledgeDocuments,
  botInstruction,
  behaviorRules,
  adsSummary,
}: OwnerChatPromptInput): string {
  const sections: string[] = [];

  // Identity
  sections.push(`## ვინ ხარ
შენ ხარ "${esc(tenant.business_name)}"-ის ბიზნეს ასისტენტი — AI მრჩეველი ბიზნესის მფლობელისთვის.
შენ ეხმარები მფლობელს მონაცემების ანალიზში, კონტენტის შექმნაში, ბიზნეს გადაწყვეტილებების მიღებაში და ნებისმიერ საკითხში.
პასუხობ ქართულად, თუ სხვა ენაზე არ გთხოვენ.
შენ არ ხარ გაყიდვების ბოტი — შენ ხარ ბიზნეს ინტელექტის ინსტრუმენტი.`);

  // Capabilities
  sections.push(`## შეძლებები
- გაყიდვების, შეკვეთების და პროდუქტების ანალიზი
- Facebook/Instagram პოსტების, სარეკლამო ტექსტების და კონტენტის შექმნა
- ბიზნეს რჩევები და სტრატეგიული წინადადებები
- მომხმარებელთა ქცევის ანალიზი
- ფინანსური გამოთვლები
- ზოგადი კითხვებზე პასუხი (არ ხარ შეზღუდული მხოლოდ ბიზნეს თემებით)

## ფორმატირება
- გამოიყენე markdown ფორმატირება: **bold**, *italic*, სიები, ცხრილები, კოდის ბლოკები
- რიცხვები და სტატისტიკა გამოყავი ცალკე
- გრძელი პასუხები დააყავი სექციებად სათაურებით`);

  // Business data context
  // Products (already filtered to is_active=true in the API query)
  if (products.length > 0) {
    const totalValue = products.reduce(
      (sum, p) => sum + p.price * p.stock_quantity,
      0,
    );
    const lowStock = products.filter(
      (p) => p.stock_quantity <= p.low_stock_threshold,
    );
    sections.push(`## პროდუქტები (${products.length} აქტიური)
ჯამური მარაგის ღირებულება: ${formatGEL(totalValue)}
დაბალი მარაგი: ${lowStock.length} პროდუქტი

${products.map((p) => `- **${esc(p.name)}** — ${formatGEL(p.price)} | მარაგი: ${p.stock_quantity}${p.description ? ` | ${esc(p.description)}` : ""}`).join("\n")}`);
  }

  // Orders
  if (orders.count > 0) {
    const recentOrders = orders.recent
      .slice(0, 10)
      .map((o: Record<string, unknown>) => {
        const items = o.items as Array<{
          name: string;
          quantity: number;
        }> | null;
        const itemsSummary =
          items?.map((i) => `${esc(i.name)} x${i.quantity}`).join(", ") || "";
        return `- #${o.order_number} — ${esc(o.customer_name as string)} | ${formatGEL(o.total as number)} | ${o.delivery_status} | ${esc(itemsSummary)}`;
      })
      .join("\n");
    sections.push(`## შეკვეთები (${orders.count} ჯამი)
ბოლო შეკვეთები:\n${recentOrders}`);
  }

  // Conversations
  if (conversations.count > 0) {
    sections.push(
      `## საუბრები\nჯამი: ${conversations.count} | აქტიური: ${conversations.active}`,
    );
  }

  // Delivery zones (already filtered to is_active=true in the API query)
  if (deliveryZones.length > 0) {
    sections.push(`## მიტანის ზონები
${deliveryZones.map((z) => `- ${esc(z.zone_name)}: ${formatGEL(z.fee)}${z.estimated_days ? ` (${esc(z.estimated_days)})` : ""}`).join("\n")}`);
  }

  // FAQs
  if (faqs.length > 0) {
    sections.push(`## ხშირი კითხვები (${faqs.length})
${faqs.map((f) => `**კ:** ${esc(f.question)}\n**პ:** ${esc(f.answer)}`).join("\n\n")}`);
  }

  // Knowledge entries
  if (knowledgeEntries.length > 0) {
    sections.push(`## სპეციალური ცოდნა
${knowledgeEntries.map((e) => `**${esc(e.title)}**\n${esc(e.content)}`).join("\n\n")}`);
  }

  // Knowledge documents
  const readyDocs = knowledgeDocuments.filter((d) => d.extracted_text);
  if (readyDocs.length > 0) {
    sections.push(`## ატვირთული დოკუმენტები
${readyDocs.map((d) => `**${esc(d.file_name)}**\n${esc(d.extracted_text)}`).join("\n\n")}`);
  }

  // Ads analytics data (if Premium and connected)
  if (adsSummary) {
    const campaignLines = adsSummary.topCampaigns
      .slice(0, 5)
      .map(
        (c) =>
          `- **${esc(c.name)}** — დახარჯული: ${formatGEL(c.spend)} | ROAS: ${c.roas.toFixed(1)}x`,
      )
      .join("\n");

    const recLines = adsSummary.recommendations
      .slice(0, 5)
      .map((r) => `- [${r.priority}] ${esc(r.category)}: ${esc(r.description)}`)
      .join("\n");

    sections.push(`## რეკლამების ანალიტიკა (Meta Ads)
ჯამური ხარჯი: ${formatGEL(adsSummary.totalSpend)} | შთაბეჭდილებები: ${adsSummary.totalImpressions.toLocaleString()} | დაწკაპუნებები: ${adsSummary.totalClicks.toLocaleString()}
CTR: ${adsSummary.avgCtr.toFixed(2)}% | CPC: ${formatGEL(adsSummary.avgCpc)} | კონვერსიები: ${adsSummary.totalConversions}

### ტოპ კამპანიები
${campaignLines || "მონაცემები ჯერ არ არის"}

### AI რეკომენდაციები
${recLines || "რეკომენდაციები ჯერ არ არის"}`);
  }

  // Bot instruction & behavior rules (for context about how the sales bot works)
  if (botInstruction?.main_instruction) {
    sections.push(
      `## გაყიდვების ბოტის ინსტრუქცია (ინფორმაციისთვის)\n${botInstruction.main_instruction}`,
    );
  }

  if (behaviorRules.length > 0) {
    sections.push(`## ბოტის ქცევის წესები (ინფორმაციისთვის)
${behaviorRules.map((r) => `- ${esc(r.rule_text)}`).join("\n")}`);
  }

  return sections.join("\n\n");
}
