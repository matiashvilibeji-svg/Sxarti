import { createAdminClient } from "@/lib/supabase/admin";
import type { SupportTicket } from "@/types/admin";

export const dynamic = "force-dynamic";
import type { Tenant } from "@/types/database";
import { TicketStatsBar } from "@/components/admin/support/ticket-stats-bar";
import { TicketFilters } from "@/components/admin/support/ticket-filters";
import { TicketList } from "@/components/admin/support/ticket-list";
import { SupportPageClient } from "./page-client";

const PAGE_SIZE = 20;

interface Props {
  searchParams: {
    status?: string;
    priority?: string;
    search?: string;
    assigned?: string;
    category?: string;
    page?: string;
  };
}

export default async function AdminSupportPage({ searchParams }: Props) {
  const supabase = createAdminClient();
  const page = parseInt(searchParams.page || "1", 10);
  const offset = (page - 1) * PAGE_SIZE;

  // Build ticket query
  let query = supabase
    .from("support_tickets")
    .select("*, tenant:tenants(*), assigned_admin:admin_users(*)", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }
  if (searchParams.priority) {
    query = query.eq("priority", searchParams.priority);
  }
  if (searchParams.category) {
    query = query.eq("category", searchParams.category);
  }
  if (searchParams.assigned === "unassigned") {
    query = query.is("assigned_admin_id", null);
  } else if (searchParams.assigned) {
    query = query.eq("assigned_admin_id", searchParams.assigned);
  }
  if (searchParams.search) {
    query = query.or(
      `subject.ilike.%${searchParams.search}%,ticket_number.ilike.%${searchParams.search}%`,
    );
  }

  // Fetch all data in parallel
  const [ticketResult, allTicketsResult, adminsResult, tenantsResult] =
    await Promise.all([
      query,
      supabase
        .from("support_tickets")
        .select(
          "id, status, priority, assigned_admin_id, resolved_at, created_at",
        ),
      supabase
        .from("admin_users")
        .select("*")
        .eq("is_active", true)
        .order("display_name"),
      supabase.from("tenants").select("*").order("business_name"),
    ]);

  const tickets = (ticketResult.data || []) as SupportTicket[];
  const totalCount = ticketResult.count || 0;
  const allTickets = (allTicketsResult.data || []) as SupportTicket[];
  const admins = adminsResult.data || [];
  const tenants = (tenantsResult.data || []) as Tenant[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">
            Support Tickets
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            Manage client inquiries, resolution times, and support requests.
          </p>
        </div>
        <SupportPageClient admins={admins} tenants={tenants} />
      </div>

      {/* Stats */}
      <TicketStatsBar tickets={allTickets} />

      {/* Filters */}
      <TicketFilters admins={admins} />

      {/* Ticket List */}
      <TicketList
        tickets={tickets}
        totalCount={totalCount}
        page={page}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
