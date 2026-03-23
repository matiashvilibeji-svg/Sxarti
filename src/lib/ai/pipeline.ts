import type { Content } from "@google/generative-ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateBotResponse, type GeminiAction } from "./gemini";
import { buildSystemPrompt } from "./prompts/system";
import { isValidTransition, type ConversationStage } from "./prompts/stages";
import { sendMessageWithRetry } from "@/lib/facebook/messenger";
import { sendInstagramMessageWithRetry } from "@/lib/instagram/messaging";
import { isGeorgianScript, latinToGeorgian } from "@/lib/utils/georgian";
import { notifyOwner } from "@/lib/notifications";
import type {
  Tenant,
  Product,
  DeliveryZone,
  FAQ,
  Message,
  Conversation,
  CartItem,
  OrderItem,
} from "@/types/database";

export interface IncomingMessage {
  platform: "messenger" | "instagram";
  platformUserId: string;
  pageId: string;
  messageText: string;
  platformMessageId?: string;
}

function generateOrderNumber(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `SX-${num}`;
}

export async function processMessage(incoming: IncomingMessage): Promise<void> {
  const supabase = createAdminClient();

  // 1. Identify tenant
  const tenantColumn =
    incoming.platform === "messenger"
      ? "facebook_page_id"
      : "instagram_account_id";

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("*")
    .eq(tenantColumn, incoming.pageId)
    .single();

  if (tenantError || !tenant) {
    console.error("Tenant not found for pageId:", incoming.pageId);
    return;
  }

  const typedTenant = tenant as Tenant;

  // 2. Deduplicate
  if (incoming.platformMessageId) {
    const { data: existing } = await supabase
      .from("messages")
      .select("id")
      .eq("platform_message_id", incoming.platformMessageId)
      .limit(1);

    if (existing && existing.length > 0) {
      return; // already processed
    }
  }

  // 3. Find or create conversation
  let { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("tenant_id", typedTenant.id)
    .eq("platform", incoming.platform)
    .eq("platform_user_id", incoming.platformUserId)
    .in("status", ["active", "handoff"])
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  // 4. Check status — if completed/abandoned or no conversation, create new
  if (!conversation) {
    const { data: newConv, error: convError } = await supabase
      .from("conversations")
      .insert({
        tenant_id: typedTenant.id,
        platform: incoming.platform,
        platform_user_id: incoming.platformUserId,
        status: "active",
        current_stage: "greeting",
        cart: [],
        customer_info: null,
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (convError || !newConv) {
      console.error("Failed to create conversation:", convError);
      return;
    }
    conversation = newConv;

    // Increment monthly conversation counter for subscription tracking
    await supabase.rpc("increment_conversations", {
      p_tenant_id: typedTenant.id,
    });
  }

  const typedConv = conversation as Conversation;

  // If handoff — store message only, don't call AI
  if (typedConv.status === "handoff") {
    await supabase.from("messages").insert({
      conversation_id: typedConv.id,
      tenant_id: typedTenant.id,
      sender: "customer",
      content: incoming.messageText,
      platform_message_id: incoming.platformMessageId ?? null,
    });
    return;
  }

  // 5. Store customer message
  await supabase.from("messages").insert({
    conversation_id: typedConv.id,
    tenant_id: typedTenant.id,
    sender: "customer",
    content: incoming.messageText,
    platform_message_id: incoming.platformMessageId ?? null,
  });

  // 6. Load context (parallel)
  const [productsRes, zonesRes, faqsRes, messagesRes] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("tenant_id", typedTenant.id)
      .eq("is_active", true),
    supabase
      .from("delivery_zones")
      .select("*")
      .eq("tenant_id", typedTenant.id)
      .eq("is_active", true),
    supabase.from("faqs").select("*").eq("tenant_id", typedTenant.id),
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", typedConv.id)
      .order("created_at", { ascending: true })
      .limit(20),
  ]);

  const products = (productsRes.data ?? []) as Product[];
  const deliveryZones = (zonesRes.data ?? []) as DeliveryZone[];
  const faqs = (faqsRes.data ?? []) as FAQ[];
  const messages = (messagesRes.data ?? []) as Message[];

  // 7. Build system prompt
  const systemPrompt = buildSystemPrompt({
    tenant: typedTenant,
    products,
    deliveryZones,
    faqs,
    conversation: typedConv,
  });

  // 8. Convert history to Gemini Content[]
  const conversationHistory: Content[] = messages
    .filter((m) => m.sender !== "human")
    .map((m) => ({
      role: m.sender === "customer" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

  // 9. Enrich with transliteration
  let enrichedMessage = incoming.messageText;
  if (!isGeorgianScript(incoming.messageText)) {
    const transliterated = latinToGeorgian(incoming.messageText);
    enrichedMessage = `${incoming.messageText}\n[ტრანსლიტერაცია: ${transliterated}]`;
  }

  // 10. Call Gemini
  let response;
  try {
    response = await generateBotResponse(
      systemPrompt,
      conversationHistory,
      enrichedMessage,
    );
  } catch (error) {
    console.error("Gemini call failed:", error);
    // Set handoff + send fallback
    await supabase
      .from("conversations")
      .update({
        status: "handoff",
        handoff_reason: "AI service failure",
        handed_off_at: new Date().toISOString(),
      })
      .eq("id", typedConv.id);

    const fallback =
      "ბოდიში, ტექნიკური შეფერხება მოხდა. ოპერატორი მალე დაგეხმარებათ.";
    await sendResponseToCustomer(typedTenant, incoming, fallback);
    return;
  }

  // 11. Execute actions
  let updatedCart = [...typedConv.cart];
  let updatedStage = typedConv.current_stage as ConversationStage;
  let conversationUpdate: Record<string, unknown> = {};
  let selectedDeliveryZone: DeliveryZone | null = null;

  for (const action of response.actions) {
    await executeAction(action, {
      supabase,
      tenant: typedTenant,
      conversation: typedConv,
      products,
      deliveryZones,
      updatedCart,
      updatedStage,
      selectedDeliveryZone,
      conversationUpdate,
      setCart: (cart) => {
        updatedCart = cart;
      },
      setStage: (stage) => {
        updatedStage = stage;
      },
      setDeliveryZone: (zone) => {
        selectedDeliveryZone = zone;
      },
      addUpdate: (update) => {
        conversationUpdate = { ...conversationUpdate, ...update };
      },
    });
  }

  // Apply accumulated conversation updates
  conversationUpdate.current_stage = updatedStage;
  conversationUpdate.cart = updatedCart;
  conversationUpdate.last_message_at = new Date().toISOString();

  await supabase
    .from("conversations")
    .update(conversationUpdate)
    .eq("id", typedConv.id);

  // 12. Store bot message
  await supabase.from("messages").insert({
    conversation_id: typedConv.id,
    tenant_id: typedTenant.id,
    sender: "bot",
    content: response.message,
  });

  // 13. Send response
  await sendResponseToCustomer(typedTenant, incoming, response.message);
}

interface ActionContext {
  supabase: ReturnType<typeof createAdminClient>;
  tenant: Tenant;
  conversation: Conversation;
  products: Product[];
  deliveryZones: DeliveryZone[];
  updatedCart: CartItem[];
  updatedStage: ConversationStage;
  selectedDeliveryZone: DeliveryZone | null;
  conversationUpdate: Record<string, unknown>;
  setCart: (cart: CartItem[]) => void;
  setStage: (stage: ConversationStage) => void;
  setDeliveryZone: (zone: DeliveryZone) => void;
  addUpdate: (update: Record<string, unknown>) => void;
}

async function executeAction(
  action: GeminiAction,
  ctx: ActionContext,
): Promise<void> {
  switch (action.type) {
    case "update_stage": {
      if (!action.stage) break;
      const newStage = action.stage as ConversationStage;
      if (isValidTransition(ctx.updatedStage, newStage)) {
        ctx.setStage(newStage);
      }
      break;
    }

    case "add_to_cart": {
      if (!action.product_id || !action.quantity) break;
      const product = ctx.products.find((p) => p.id === action.product_id);
      if (!product || product.stock_quantity < action.quantity) break;

      const existingIndex = ctx.updatedCart.findIndex(
        (item) => item.product_id === action.product_id,
      );
      const newCart = [...ctx.updatedCart];
      if (existingIndex >= 0) {
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + action.quantity,
        };
      } else {
        newCart.push({
          product_id: action.product_id,
          quantity: action.quantity,
        });
      }
      ctx.setCart(newCart);
      break;
    }

    case "decrement_stock": {
      if (!action.product_id || !action.quantity) break;
      const stockProduct = ctx.products.find((p) => p.id === action.product_id);
      // Atomic decrement — only succeeds if stock_quantity >= quantity
      const { error } = await ctx.supabase.rpc("decrement_stock", {
        p_product_id: action.product_id,
        p_quantity: action.quantity,
      });
      if (error) {
        console.error("Stock decrement failed:", error);
      } else if (stockProduct) {
        // Check for low stock after decrement
        const remaining = stockProduct.stock_quantity - action.quantity;
        if (remaining <= stockProduct.low_stock_threshold) {
          notifyOwner(ctx.tenant.id, "low_stock", {
            product_name: stockProduct.name,
            remaining,
          }).catch(() => {});
        }
      }
      break;
    }

    case "create_order": {
      if (ctx.updatedCart.length === 0) break;

      const customerInfo = ctx.conversation.customer_info;
      if (
        !customerInfo?.name ||
        !customerInfo?.phone ||
        !customerInfo?.address
      ) {
        break;
      }

      // Build order items
      const orderItems: OrderItem[] = [];
      for (const cartItem of ctx.updatedCart) {
        const product = ctx.products.find((p) => p.id === cartItem.product_id);
        if (!product) continue;
        const item: OrderItem = {
          product_id: cartItem.product_id,
          name: product.name,
          quantity: cartItem.quantity,
          unit_price: product.price,
        };
        if (cartItem.variant) item.variant = cartItem.variant;
        orderItems.push(item);
      }

      const subtotal = orderItems.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0,
      );

      const deliveryFee = ctx.selectedDeliveryZone?.fee ?? 0;
      const total = subtotal + deliveryFee;

      // Try generating unique order number (max 3 attempts)
      let orderNumber = "";
      for (let attempt = 0; attempt < 3; attempt++) {
        orderNumber = generateOrderNumber();
        const { error: insertError } = await ctx.supabase
          .from("orders")
          .insert({
            tenant_id: ctx.tenant.id,
            conversation_id: ctx.conversation.id,
            order_number: orderNumber,
            customer_name: customerInfo.name,
            customer_phone: customerInfo.phone,
            customer_address: customerInfo.address,
            items: orderItems,
            subtotal,
            delivery_fee: deliveryFee,
            total,
            delivery_zone_id: ctx.selectedDeliveryZone?.id ?? null,
            payment_status: "pending",
            delivery_status: "pending",
          });

        if (!insertError) break;
        if (attempt === 2) {
          console.error("Failed to create order after 3 attempts");
          return;
        }
      }

      // Mark conversation complete
      ctx.setCart([]);
      ctx.addUpdate({
        status: "completed",
      });
      ctx.setStage("complete");

      // Notify owner about new order
      notifyOwner(ctx.tenant.id, "new_order", {
        order_number: orderNumber,
        customer_name: customerInfo.name,
        total,
      }).catch(() => {});
      break;
    }

    case "set_delivery_zone": {
      if (!action.delivery_zone_id) break;
      const zone = ctx.deliveryZones.find(
        (z) => z.id === action.delivery_zone_id,
      );
      if (zone) {
        ctx.setDeliveryZone(zone);
      }
      break;
    }

    case "update_customer_info": {
      if (!action.customer_info) break;
      const existing = ctx.conversation.customer_info ?? {};
      const merged = {
        ...existing,
        ...Object.fromEntries(
          Object.entries(action.customer_info).filter(([, v]) => v),
        ),
      };
      // Update both the DB payload and the in-memory conversation
      // so subsequent actions (e.g. create_order) see the updated info
      ctx.conversation.customer_info = merged;
      if (merged.name) {
        ctx.addUpdate({ customer_info: merged, customer_name: merged.name });
      } else {
        ctx.addUpdate({ customer_info: merged });
      }
      break;
    }

    case "request_handoff": {
      ctx.addUpdate({
        status: "handoff",
        handoff_reason: action.reason ?? "Customer requested human agent",
        handed_off_at: new Date().toISOString(),
      });

      // Notify owner about handoff
      notifyOwner(ctx.tenant.id, "handoff", {
        customer_name:
          ctx.conversation.customer_name ??
          ctx.conversation.customer_info?.name ??
          "უცნობი",
        reason: action.reason ?? "Customer requested human agent",
      }).catch(() => {});
      break;
    }
  }
}

async function sendResponseToCustomer(
  tenant: Tenant,
  incoming: IncomingMessage,
  message: string,
): Promise<void> {
  try {
    if (incoming.platform === "messenger") {
      if (!tenant.facebook_access_token) {
        console.error("No Facebook access token for tenant:", tenant.id);
        return;
      }
      await sendMessageWithRetry(
        tenant.facebook_access_token,
        incoming.platformUserId,
        message,
      );
    } else {
      if (!tenant.facebook_access_token || !tenant.instagram_account_id) {
        console.error("No Instagram credentials for tenant:", tenant.id);
        return;
      }
      await sendInstagramMessageWithRetry(
        tenant.facebook_access_token,
        tenant.instagram_account_id,
        incoming.platformUserId,
        message,
      );
    }
  } catch (error) {
    console.error("Failed to send response:", error);
  }
}
