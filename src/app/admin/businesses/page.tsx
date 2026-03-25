import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getAdminUser } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { BusinessStatsBar } from "@/components/admin/businesses/business-stats-bar";
import { BusinessFilters } from "@/components/admin/businesses/business-filters";
import { BusinessTable } from "@/components/admin/businesses/business-table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 20;

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    plan?: string;
    status?: string;
    page?: string;
  };
}) {
  const admin = await getAdminUser();
  if (!admin) redirect("/login");

  const supabase = createAdminClient();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Build filtered query
  let query = supabase
    .from("tenants")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (searchParams.search) {
    query = query.ilike("business_name", `%${searchParams.search}%`);
  }
  if (searchParams.plan && searchParams.plan !== "all") {
    query = query.eq("subscription_plan", searchParams.plan);
  }
  if (searchParams.status && searchParams.status !== "all") {
    query = query.eq("subscription_status", searchParams.status);
  }

  const { data: tenants, count } = await query;
  const businesses = tenants ?? [];
  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Fetch owner emails via auth admin API
  const ownerIds = Array.from(new Set(businesses.map((t) => t.owner_id)));
  const emailMap = new Map<string, string>();

  if (ownerIds.length > 0) {
    const { data: usersData } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });
    if (usersData?.users) {
      for (const user of usersData.users) {
        if (user.email) emailMap.set(user.id, user.email);
      }
    }
  }

  const businessesWithEmail = businesses.map((biz) => ({
    ...biz,
    owner_email: emailMap.get(biz.owner_id),
  }));

  // Stats query (unfiltered)
  const { data: allTenants } = await supabase
    .from("tenants")
    .select("subscription_plan, subscription_status, trial_ends_at");

  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const stats = {
    total: allTenants?.length ?? 0,
    starter:
      allTenants?.filter((t) => t.subscription_plan === "starter").length ?? 0,
    business:
      allTenants?.filter((t) => t.subscription_plan === "business").length ?? 0,
    premium:
      allTenants?.filter((t) => t.subscription_plan === "premium").length ?? 0,
    activeTrials:
      allTenants?.filter((t) => t.subscription_status === "trial").length ?? 0,
    expiringThisWeek:
      allTenants?.filter((t) => {
        if (t.subscription_status !== "trial" || !t.trial_ends_at) return false;
        const end = new Date(t.trial_ends_at);
        return end >= now && end <= weekFromNow;
      }).length ?? 0,
  };

  // Pagination link builder
  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (searchParams.search) params.set("search", searchParams.search);
    if (searchParams.plan) params.set("plan", searchParams.plan);
    if (searchParams.status) params.set("status", searchParams.status);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/admin/businesses${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-display text-on-surface">
          Businesses
        </h1>
        <p className="text-sm text-on-surface-variant">
          Manage all tenant businesses on the platform.
        </p>
      </div>

      <BusinessStatsBar stats={stats} />

      <Suspense fallback={null}>
        <BusinessFilters />
      </Suspense>

      <BusinessTable businesses={businessesWithEmail} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-sm text-on-surface-variant">
            Showing {from + 1}–{Math.min(from + PAGE_SIZE, totalCount)} of{" "}
            {totalCount}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={pageUrl(page - 1)}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
            )}
            <span className="text-sm text-on-surface-variant">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={pageUrl(page + 1)}>
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
