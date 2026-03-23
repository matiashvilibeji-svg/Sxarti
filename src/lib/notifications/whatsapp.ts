export type NotificationType =
  | "new_order"
  | "handoff"
  | "low_stock"
  | "daily_summary"
  | "problematic";

const TEMPLATES: Record<
  NotificationType,
  (data: Record<string, unknown>) => string
> = {
  new_order: (data) =>
    `🛒 *ახალი შეკვეთა!*\n\nშეკვეთის ნომერი: ${data.order_number}\nმომხმარებელი: ${data.customer_name}\nთანხა: ${data.total} ₾\n\nშეკვეთის დეტალები იხილეთ პანელში.`,
  handoff: (data) =>
    `🤝 *საუბარი გადაეცა ოპერატორს*\n\nმომხმარებელი: ${data.customer_name}\nმიზეზი: ${data.reason}\n\nგთხოვთ, შეამოწმოთ პანელში.`,
  low_stock: (data) =>
    `⚠️ *მარაგი მცირეა!*\n\nპროდუქტი: ${data.product_name}\nდარჩენილი რაოდენობა: ${data.remaining}\n\nგთხოვთ, შეავსოთ მარაგი.`,
  daily_summary: (data) =>
    `📊 *დღის შეჯამება*\n\nახალი შეკვეთები: ${data.orders_count}\nშემოსავალი: ${data.revenue} ₾\nსაუბრები: ${data.conversations_count}\n\nწარმატებულ სავაჭრო დღეს გისურვებთ!`,
  problematic: (data) =>
    `🚨 *პრობლემური შემთხვევა!*\n\nმომხმარებელი: ${data.customer_name}\nმიზეზი: ${data.reason}\n\nგთხოვთ, შეამოწმოთ საუბარი პანელში.`,
};

export async function sendWhatsAppNotification(
  phoneNumber: string,
  message: string,
  type: NotificationType,
): Promise<{ success: boolean; error?: string }> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return { success: false, error: "WhatsApp credentials not configured" };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "text",
          text: { body: message },
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `WhatsApp API error: ${error}` };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `WhatsApp send failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export function buildWhatsAppMessage(
  type: NotificationType,
  data: Record<string, unknown>,
): string {
  return TEMPLATES[type](data);
}
