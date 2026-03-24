"use client";

import { useCallback, useEffect, useState } from "react";
import { useSupabase } from "./use-supabase";

interface WebSearchQuota {
  usage: number;
  limit: number;
  isExhausted: boolean;
  isDisabled: boolean;
  isUnlimited: boolean;
  isLoading: boolean;
  refetch: () => void;
}

export function useWebSearchQuota(
  tenantId: string | undefined,
): WebSearchQuota {
  const supabase = useSupabase();
  const [usage, setUsage] = useState(0);
  const [limit, setLimit] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuota = useCallback(async () => {
    if (!tenantId) return;

    try {
      // Fetch limit for the owner's plan
      const { data: limitData } = await supabase
        .from("web_search_limits")
        .select("monthly_limit")
        .single();

      const monthlyLimit = limitData?.monthly_limit ?? 0;
      setLimit(monthlyLimit);

      // Fetch current month's usage — must match server's date_trunc('month', now())::date (UTC)
      const now = new Date();
      const monthStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;

      const { data: usageData } = await supabase
        .from("web_search_usage")
        .select("usage_count")
        .eq("tenant_id", tenantId)
        .eq("month", monthStr)
        .maybeSingle();

      setUsage(usageData?.usage_count ?? 0);
    } catch {
      // Silently fail — quota UI will show defaults
    } finally {
      setIsLoading(false);
    }
  }, [supabase, tenantId]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  const isUnlimited = limit === -1;
  const isDisabled = limit === 0;
  const isExhausted = !isUnlimited && !isDisabled && usage >= limit;

  return {
    usage,
    limit,
    isExhausted,
    isDisabled,
    isUnlimited,
    isLoading,
    refetch: fetchQuota,
  };
}
