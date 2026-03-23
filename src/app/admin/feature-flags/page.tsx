import { createAdminClient } from "@/lib/supabase/admin";
import { FlagList } from "@/components/admin/feature-flags/flag-list";
import type { FeatureFlag } from "@/types/admin";

export const dynamic = "force-dynamic";

export default async function FeatureFlagsPage() {
  const supabase = createAdminClient();

  const [flagsResult, tenantsResult] = await Promise.all([
    supabase
      .from("feature_flags")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("tenants").select("id, business_name").order("business_name"),
  ]);

  const flags = (flagsResult.data || []) as FeatureFlag[];
  const tenants = (tenantsResult.data || []) as {
    id: string;
    business_name: string;
  }[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Feature Flags</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Manage system-wide toggles and tenant-specific overrides.
        </p>
      </div>

      <FlagList initialFlags={flags} tenants={tenants} />
    </div>
  );
}
