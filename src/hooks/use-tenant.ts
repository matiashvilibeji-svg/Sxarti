"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabase } from "./use-supabase";
import type { Tenant } from "@/types/database";

const TENANT_CACHE_KEY = "sxarti_tenant_cache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface TenantCache {
  tenant: Tenant;
  timestamp: number;
}

function getCachedTenant(): Tenant | null {
  try {
    const cached = sessionStorage.getItem(TENANT_CACHE_KEY);
    if (!cached) return null;
    const parsed: TenantCache = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(TENANT_CACHE_KEY);
      return null;
    }
    return parsed.tenant;
  } catch {
    return null;
  }
}

function setCachedTenant(tenant: Tenant) {
  try {
    sessionStorage.setItem(
      TENANT_CACHE_KEY,
      JSON.stringify({ tenant, timestamp: Date.now() }),
    );
  } catch {
    // sessionStorage full or unavailable — ignore
  }
}

export function useTenant() {
  const supabase = useSupabase();
  const [tenant, setTenantState] = useState<Tenant | null>(() =>
    getCachedTenant(),
  );
  const [loading, setLoading] = useState(() => !getCachedTenant());
  const [error, setError] = useState<string | null>(null);

  const setTenant = useCallback((t: Tenant | null) => {
    setTenantState(t);
    if (t) {
      setCachedTenant(t);
    } else {
      try {
        sessionStorage.removeItem(TENANT_CACHE_KEY);
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    // If we have cached data, skip the initial fetch
    const cached = getCachedTenant();
    if (cached) {
      setTenantState(cached);
      setLoading(false);
      return;
    }

    async function fetchTenant() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("tenants")
          .select("*")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (fetchError) {
          setError(fetchError.message);
        } else if (data) {
          setTenantState(data as Tenant);
          setCachedTenant(data as Tenant);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch tenant");
      } finally {
        setLoading(false);
      }
    }

    fetchTenant();
  }, [supabase]);

  return { tenant, setTenant, loading, error };
}
