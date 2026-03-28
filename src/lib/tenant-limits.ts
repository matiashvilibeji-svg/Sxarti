import { createAdminClient } from "@/lib/supabase/admin";

export interface TenantLimits {
  max_bot_messages: number;
  max_owner_chat_messages: number;
  max_owner_chat_chars: number;
  max_conversations_monthly: number | null;
}

const DEFAULTS: TenantLimits = {
  max_bot_messages: 20,
  max_owner_chat_messages: 20,
  max_owner_chat_chars: 10000,
  max_conversations_monthly: null,
};

export async function getTenantLimits(tenantId: string): Promise<TenantLimits> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("tenant_limits")
    .select(
      "max_bot_messages, max_owner_chat_messages, max_owner_chat_chars, max_conversations_monthly",
    )
    .eq("tenant_id", tenantId)
    .single();

  if (!data) return DEFAULTS;

  return {
    max_bot_messages: data.max_bot_messages ?? DEFAULTS.max_bot_messages,
    max_owner_chat_messages:
      data.max_owner_chat_messages ?? DEFAULTS.max_owner_chat_messages,
    max_owner_chat_chars:
      data.max_owner_chat_chars ?? DEFAULTS.max_owner_chat_chars,
    max_conversations_monthly: data.max_conversations_monthly,
  };
}
