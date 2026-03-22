import { createAdminClient } from "@/lib/supabase/admin";

import {
  sendWhatsAppNotification,
  buildWhatsAppMessage,
  type NotificationType,
} from "./whatsapp";
import { sendTelegramNotification, buildTelegramMessage } from "./telegram";

export type { NotificationType } from "./whatsapp";

export interface NotificationData {
  order_number?: string;
  customer_name?: string;
  total?: number;
  reason?: string;
  product_name?: string;
  remaining?: number;
  orders_count?: number;
  revenue?: number;
  conversations_count?: number;
  [key: string]: unknown;
}

export async function notifyOwner(
  tenantId: string,
  type: NotificationType,
  data: NotificationData,
): Promise<{ whatsapp?: boolean; telegram?: boolean }> {
  const supabase = createAdminClient();

  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("notification_config")
    .eq("id", tenantId)
    .single();

  if (error || !tenant?.notification_config) {
    return {};
  }

  const config = tenant.notification_config as {
    whatsapp_number?: string;
    telegram_chat_id?: string;
    preferences?: Record<string, boolean>;
  };

  // Check if this notification type is enabled in preferences
  if (config.preferences && config.preferences[type] === false) {
    return {};
  }

  const results: { whatsapp?: boolean; telegram?: boolean } = {};
  const promises: Promise<void>[] = [];

  if (config.whatsapp_number) {
    const message = buildWhatsAppMessage(type, data);
    promises.push(
      sendWhatsAppNotification(config.whatsapp_number, message, type).then(
        (res) => {
          results.whatsapp = res.success;
        },
      ),
    );
  }

  if (config.telegram_chat_id) {
    const message = buildTelegramMessage(type, data);
    promises.push(
      sendTelegramNotification(config.telegram_chat_id, message, type).then(
        (res) => {
          results.telegram = res.success;
        },
      ),
    );
  }

  await Promise.allSettled(promises);

  return results;
}
