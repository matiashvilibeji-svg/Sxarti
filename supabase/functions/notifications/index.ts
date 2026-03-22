import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type NotificationType = "new_order" | "handoff" | "low_stock" | "daily_summary";

const WA_TEMPLATES: Record<
  NotificationType,
  (data: Record<string, unknown>) => string
> = {
  new_order: (d) =>
    `🛒 *ახალი შეკვეთა!*\n\nშეკვეთის ნომერი: ${d.order_number}\nმომხმარებელი: ${d.customer_name}\nთანხა: ${d.total} ₾`,
  handoff: (d) =>
    `🤝 *საუბარი გადაეცა ოპერატორს*\n\nმომხმარებელი: ${d.customer_name}\nმიზეზი: ${d.reason}`,
  low_stock: (d) =>
    `⚠️ *მარაგი მცირეა!*\n\nპროდუქტი: ${d.product_name}\nდარჩენილი: ${d.remaining}`,
  daily_summary: (d) =>
    `📊 *დღის შეჯამება*\n\nშეკვეთები: ${d.orders_count}\nშემოსავალი: ${d.revenue} ₾\nსაუბრები: ${d.conversations_count}`,
};

const TG_TEMPLATES: Record<
  NotificationType,
  (data: Record<string, unknown>) => string
> = {
  new_order: (d) =>
    `🛒 <b>ახალი შეკვეთა!</b>\n\nშეკვეთის ნომერი: ${d.order_number}\nმომხმარებელი: ${d.customer_name}\nთანხა: ${d.total} ₾`,
  handoff: (d) =>
    `🤝 <b>საუბარი გადაეცა ოპერატორს</b>\n\nმომხმარებელი: ${d.customer_name}\nმიზეზი: ${d.reason}`,
  low_stock: (d) =>
    `⚠️ <b>მარაგი მცირეა!</b>\n\nპროდუქტი: ${d.product_name}\nდარჩენილი: ${d.remaining}`,
  daily_summary: (d) =>
    `📊 <b>დღის შეჯამება</b>\n\nშეკვეთები: ${d.orders_count}\nშემოსავალი: ${d.revenue} ₾\nსაუბრები: ${d.conversations_count}`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { tenant_id, type, data } = (await req.json()) as {
      tenant_id: string;
      type: NotificationType;
      data: Record<string, unknown>;
    };

    if (!tenant_id || !type || !data) {
      return new Response(
        JSON.stringify({ error: "Missing tenant_id, type, or data" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: tenant } = await supabase
      .from("tenants")
      .select("notification_config")
      .eq("id", tenant_id)
      .single();

    if (!tenant?.notification_config) {
      return new Response(
        JSON.stringify({ message: "No notification config" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const config = tenant.notification_config as {
      whatsapp_number?: string;
      telegram_chat_id?: string;
      preferences?: Record<string, boolean>;
    };

    // Check if notification type is enabled
    if (config.preferences?.[type] === false) {
      return new Response(
        JSON.stringify({ message: "Notification type disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results: { whatsapp?: boolean; telegram?: boolean } = {};

    // Send WhatsApp
    if (config.whatsapp_number) {
      const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
      const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");

      if (phoneNumberId && accessToken) {
        const message = WA_TEMPLATES[type](data);
        const res = await fetch(
          `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: config.whatsapp_number,
              type: "text",
              text: { body: message },
            }),
          },
        );
        results.whatsapp = res.ok;
      }
    }

    // Send Telegram
    if (config.telegram_chat_id) {
      const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

      if (botToken) {
        const message = TG_TEMPLATES[type](data);
        const res = await fetch(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: config.telegram_chat_id,
              text: message,
              parse_mode: "HTML",
            }),
          },
        );
        results.telegram = res.ok;
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
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
