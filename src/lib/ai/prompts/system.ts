import type {
  Tenant,
  Product,
  DeliveryZone,
  FAQ,
  Conversation,
  CartItem,
} from "@/types/database";
import { STAGES, type ConversationStage } from "./stages";
import { formatGEL } from "@/lib/utils/currency";

interface SystemPromptInput {
  tenant: Tenant;
  products: Product[];
  deliveryZones: DeliveryZone[];
  faqs: FAQ[];
  conversation: Conversation;
}

export function buildSystemPrompt({
  tenant,
  products,
  deliveryZones,
  faqs,
  conversation,
}: SystemPromptInput): string {
  const sections: string[] = [];

  // Section 1 — Identity
  sections.push(`## ვინ ხარ
შენ ხარ "${tenant.bot_persona_name}" — "${tenant.business_name}"-ის გაყიდვების ასისტენტი.
ტონი: ${tenant.bot_tone === "formal" ? "ფორმალური" : tenant.bot_tone === "friendly" ? "მეგობრული" : "თავისუფალი"}.
პასუხობ ქართულად.`);

  // Section 2 — Rules
  sections.push(`## წესები
- არასოდეს გაამხილო რომ ხელოვნური ინტელექტი ხარ
- მხოლოდ კატალოგში არსებული პროდუქტები გაყიდე
- თუ არ იცი პასუხი ან მომხმარებელს რთული საკითხი აქვს — გადაამისამართე ოპერატორზე
- ნუ მოიგონებ ფასებს ან პროდუქტის დეტალებს
- ყოველთვის იყავი თავაზიანი და პროფესიონალური`);

  // Section 3 — Products
  const activeProducts = products.filter(
    (p) => p.is_active && p.stock_quantity > 0,
  );
  if (activeProducts.length > 0) {
    const productList = activeProducts
      .map(
        (p) =>
          `- **${p.name}** (ID: ${p.id}) — ${formatGEL(p.price)} | მარაგი: ${p.stock_quantity}${p.description ? ` | ${p.description}` : ""}`,
      )
      .join("\n");
    sections.push(`## პროდუქტები\n${productList}`);
  } else {
    sections.push("## პროდუქტები\nამჟამად პროდუქტები არ არის ხელმისაწვდომი.");
  }

  // Section 4 — Delivery Zones
  const activeZones = deliveryZones.filter((z) => z.is_active);
  if (activeZones.length > 0) {
    const zoneList = activeZones
      .map(
        (z) =>
          `- ${z.zone_name}: ${formatGEL(z.fee)}${z.estimated_days ? ` (${z.estimated_days})` : ""}`,
      )
      .join("\n");
    sections.push(`## მიტანის ზონები\n${zoneList}`);
  }

  // Section 5 — Payment Info
  if (tenant.payment_details) {
    const pay = tenant.payment_details;
    const paymentLines: string[] = [];
    if (pay.bog_iban) paymentLines.push(`BOG IBAN: ${pay.bog_iban}`);
    if (pay.tbc_account) paymentLines.push(`TBC ანგარიში: ${pay.tbc_account}`);
    if (pay.instructions) paymentLines.push(pay.instructions);
    if (paymentLines.length > 0) {
      sections.push(`## გადახდა\n${paymentLines.join("\n")}`);
    }
  }

  // Section 6 — FAQs
  if (faqs.length > 0) {
    const faqList = faqs
      .map((f) => `**კ:** ${f.question}\n**პ:** ${f.answer}`)
      .join("\n\n");
    sections.push(`## ხშირი კითხვები\n${faqList}`);
  }

  // Section 7 — Current State
  const stage = conversation.current_stage as ConversationStage;
  const cartSummary =
    conversation.cart.length > 0
      ? conversation.cart
          .map((item: CartItem) => {
            const product = products.find((p) => p.id === item.product_id);
            return `- ${product?.name ?? "უცნობი"} x${item.quantity}${item.variant ? ` (${item.variant})` : ""}`;
          })
          .join("\n")
      : "კალათა ცარიელია";

  const customerSummary = conversation.customer_info
    ? Object.entries(conversation.customer_info)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")
    : "ინფორმაცია არ არის შეგროვებული";

  sections.push(`## მიმდინარე მდგომარეობა
ეტაპი: ${stage}
კალათა:\n${cartSummary}
მომხმარებლის ინფო: ${customerSummary}`);

  // Section 8 — Stage Instructions
  const stageDef = STAGES[stage];
  if (stageDef) {
    sections.push(`## ეტაპის ინსტრუქციები\n${stageDef.instructions}`);
  }

  // Section 9 — Output Format
  sections.push(`## პასუხის ფორმატი
უპასუხე JSON ფორმატით:
{
  "message": "შეტყობინება მომხმარებლისთვის ქართულად",
  "actions": [
    { "type": "update_stage", "stage": "needs_assessment" },
    { "type": "add_to_cart", "product_id": "...", "quantity": 1 },
    { "type": "decrement_stock", "product_id": "...", "quantity": 1 },
    { "type": "create_order" },
    { "type": "request_handoff", "reason": "..." }
  ]
}`);

  return sections.join("\n\n");
}
