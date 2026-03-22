"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "./use-supabase";
import type { Tenant } from "@/types/database";

export function useTenant() {
  const supabase = useSupabase();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
          .single();

        if (fetchError) {
          setError(fetchError.message);
        } else {
          setTenant(data as Tenant);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch tenant");
      } finally {
        setLoading(false);
      }
    }

    fetchTenant();
  }, [supabase]);

  return { tenant, loading, error };
}
