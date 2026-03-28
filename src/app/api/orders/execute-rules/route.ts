import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  executeOrderRules,
  notifyCustomerOnDelivery,
  statusChangeToTrigger,
} from "@/lib/orders/rules-engine";
import type { OrderRuleTrigger } from "@/types/database";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    tenant_id: string;
    order_id: string;
    trigger_event?: OrderRuleTrigger;
    field?: "payment_status" | "delivery_status";
    value?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tenant_id, order_id } = body;
  if (!tenant_id || !order_id) {
    return NextResponse.json(
      { error: "tenant_id and order_id are required" },
      { status: 400 },
    );
  }

  // Verify tenant ownership
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("id", tenant_id)
    .eq("owner_id", user.id)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Determine trigger event
  let triggerEvent = body.trigger_event;
  if (!triggerEvent && body.field && body.value) {
    triggerEvent = statusChangeToTrigger(body.field, body.value) ?? undefined;
  }

  if (!triggerEvent) {
    return NextResponse.json(
      { error: "Could not determine trigger event" },
      { status: 400 },
    );
  }

  const result = await executeOrderRules(tenant_id, order_id, triggerEvent);

  // Built-in: notify customer when order is delivered
  if (triggerEvent === "order_delivered") {
    notifyCustomerOnDelivery(tenant_id, order_id).catch(() => {});
  }

  return NextResponse.json(result);
}
