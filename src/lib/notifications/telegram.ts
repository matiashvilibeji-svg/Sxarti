import type { NotificationType } from "./whatsapp";

const TEMPLATES: Record<
  NotificationType,
  (data: Record<string, unknown>) => string
> = {
  new_order: (data) =>
    `🛒 <b>ახალი შეკვეთა!</b>\n\nშეკვეთის ნომერი: ${data.order_number}\nმომხმარებელი: ${data.customer_name}\nთანხა: ${data.total} ₾\n\nშეკვეთის დეტალები იხილეთ პანელში.`,
  handoff: (data) =>
    `🤝 <b>საუბარი გადაეცა ოპერატორს</b>\n\nმომხმარებელი: ${data.customer_name}\nმიზეზი: ${data.reason}\n\nგთხოვთ, შეამოწმოთ პანელში.`,
  low_stock: (data) =>
    `⚠️ <b>მარაგი მცირეა!</b>\n\nპროდუქტი: ${data.product_name}\nდარჩენილი რაოდენობა: ${data.remaining}\n\nგთხოვთ, შეავსოთ მარაგი.`,
  daily_summary: (data) =>
    `📊 <b>დღის შეჯამება</b>\n\nახალი შეკვეთები: ${data.orders_count}\nშემოსავალი: ${data.revenue} ₾\nსაუბრები: ${data.conversations_count}\n\nწარმატებულ სავაჭრო დღეს გისურვებთ!`,
  problematic: (data) =>
    `🚨 <b>პრობლემური შემთხვევა!</b>\n\nმომხმარებელი: ${data.customer_name}\nმიზეზი: ${data.reason}\n\nგთხოვთ, შეამოწმოთ საუბარი პანელში.`,
  automation: (data) => `⚡ <b>ავტომატიზაცია</b>\n\n${data.custom_message}`,
};

export async function sendTelegramNotification(
  chatId: string,
  message: string,
  _type: NotificationType,
): Promise<{ success: boolean; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return { success: false, error: "Telegram bot token not configured" };
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Telegram API error: ${error}` };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Telegram send failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export function buildTelegramMessage(
  type: NotificationType,
  data: Record<string, unknown>,
): string {
  return TEMPLATES[type](data);
}
