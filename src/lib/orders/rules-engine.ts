import { createAdminClient } from "@/lib/supabase/admin";
import { notifyOwner } from "@/lib/notifications";
import { appendOrderToSheet } from "@/lib/sheets/sync";
import { sendMessageWithRetry } from "@/lib/facebook/messenger";
import { sendInstagramMessageWithRetry } from "@/lib/instagram/messaging";
import type {
  Conversation,
  Order,
  OrderRule,
  OrderRuleTrigger,
  Tenant,
} from "@/types/database";

function interpolateTemplate(template: string, order: Order): string {
  return template
    .replace(/\{order_number\}/g, order.order_number)
    .replace(/\{customer_name\}/g, order.customer_name)
    .replace(/\{customer_phone\}/g, order.customer_phone)
    .replace(/\{customer_address\}/g, order.customer_address)
    .replace(/\{total\}/g, String(order.total))
    .replace(/\{subtotal\}/g, String(order.subtotal))
    .replace(/\{delivery_fee\}/g, String(order.delivery_fee))
    .replace(/\{items_count\}/g, String(order.items.length));
}

export async function executeOrderRules(
  tenantId: string,
  orderId: string,
  triggerEvent: OrderRuleTrigger,
): Promise<{ executed: number; errors: string[] }> {
  const supabase = createAdminClient();

  // Fetch active rules matching this trigger
  const { data: rules, error: rulesError } = await supabase
    .from("order_rules")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("trigger_event", triggerEvent)
    .eq("is_active", true);

  if (rulesError || !rules || rules.length === 0) {
    return { executed: 0, errors: rulesError ? [rulesError.message] : [] };
  }

  // Fetch the order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { executed: 0, errors: ["Order not found"] };
  }

  const typedOrder = order as Order;
  const errors: string[] = [];
  let executed = 0;

  for (const rule of rules as OrderRule[]) {
    try {
      switch (rule.action_type) {
        case "google_sheet_sync": {
          // Get sheet ID from rule config or fall back to tenant default
          let sheetId = rule.action_config.sheet_id;
          if (!sheetId) {
            const { data: tenant } = await supabase
              .from("tenants")
              .select("google_sheet_id")
              .eq("id", tenantId)
              .single();
            sheetId = tenant?.google_sheet_id;
          }
          if (sheetId) {
            const result = await appendOrderToSheet(typedOrder, sheetId);
            if (!result.success) {
              errors.push(`Sheet sync failed: ${result.error}`);
              continue;
            }
          } else {
            errors.push("No Google Sheet ID configured");
            continue;
          }
          break;
        }

        case "message_customer": {
          const template =
            rule.action_config.template || "შეკვეთა {order_number} - მადლობა!";
          const message = interpolateTemplate(template, typedOrder);
          const result = await sendCustomerMessage(
            tenantId,
            typedOrder,
            message,
          );
          if (!result.success) {
            errors.push(result.error ?? "Failed to message customer");
            continue;
          }
          break;
        }

        case "notify_owner": {
          const ownerMessage =
            rule.action_config.message ||
            "შეკვეთა {order_number} - სტატუსი შეიცვალა";
          const interpolated = interpolateTemplate(ownerMessage, typedOrder);
          await notifyOwner(tenantId, "automation", {
            custom_message: interpolated,
          });
          break;
        }
      }
      executed++;
    } catch (err) {
      errors.push(
        `Rule "${rule.name}" failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return { executed, errors };
}

const DEFAULT_DELIVERY_TEMPLATE =
  "გამარჯობა {customer_name}! თქვენი შეკვეთა #{order_number} მიწოდებულია. მადლობა შეძენისთვის!";

/**
 * Send a message to a customer through their conversation platform
 */
export async function sendCustomerMessage(
  tenantId: string,
  order: Order,
  messageText: string,
): Promise<{ success: boolean; error?: string }> {
  if (!order.conversation_id) {
    return { success: false, error: "No conversation linked to order" };
  }

  const supabase = createAdminClient();

  const { data: conv } = await supabase
    .from("conversations")
    .select("platform, platform_user_id, tenant_id")
    .eq("id", order.conversation_id)
    .single();

  if (!conv) {
    return { success: false, error: "Conversation not found" };
  }

  const typedConv = conv as Pick<
    Conversation,
    "platform" | "platform_user_id" | "tenant_id"
  >;

  const { data: tenantData } = await supabase
    .from("tenants")
    .select("facebook_access_token, instagram_account_id")
    .eq("id", tenantId)
    .single();

  const t = tenantData as Pick<
    Tenant,
    "facebook_access_token" | "instagram_account_id"
  > | null;

  if (!t?.facebook_access_token) {
    return { success: false, error: "Facebook/Instagram not connected" };
  }

  if (typedConv.platform === "messenger") {
    await sendMessageWithRetry(
      t.facebook_access_token,
      typedConv.platform_user_id,
      messageText,
    );
  } else if (typedConv.platform === "instagram" && t.instagram_account_id) {
    await sendInstagramMessageWithRetry(
      t.facebook_access_token,
      t.instagram_account_id,
      typedConv.platform_user_id,
      messageText,
    );
  }

  // Store the message in DB
  await supabase.from("messages").insert({
    conversation_id: order.conversation_id,
    tenant_id: tenantId,
    sender: "bot",
    content: messageText,
  });

  return { success: true };
}

/**
 * Built-in notification: send delivery message to customer
 */
export async function notifyCustomerOnDelivery(
  tenantId: string,
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Check if user already has an automation rule for order_delivered + message_customer
  // to avoid duplicate messages
  const { data: existingRules } = await supabase
    .from("order_rules")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("trigger_event", "order_delivered")
    .eq("action_type", "message_customer")
    .eq("is_active", true)
    .limit(1);

  if (existingRules && existingRules.length > 0) {
    // User has a custom rule — skip built-in to avoid double message
    return { success: true };
  }

  // Fetch order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: "Order not found" };
  }

  const typedOrder = order as Order;

  // Fetch tenant's custom template
  const { data: tenant } = await supabase
    .from("tenants")
    .select("delivery_message_template")
    .eq("id", tenantId)
    .single();

  const template =
    (tenant?.delivery_message_template as string | null) ||
    DEFAULT_DELIVERY_TEMPLATE;
  const message = interpolateTemplate(template, typedOrder);

  return sendCustomerMessage(tenantId, typedOrder, message);
}

/**
 * Maps order status field changes to trigger events
 */
export function statusChangeToTrigger(
  field: "payment_status" | "delivery_status",
  value: string,
): OrderRuleTrigger | null {
  if (field === "payment_status" && value === "confirmed")
    return "payment_confirmed";
  if (field === "delivery_status" && value === "shipped")
    return "order_shipped";
  if (field === "delivery_status" && value === "delivered")
    return "order_delivered";
  return null;
}
