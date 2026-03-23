import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { SupportTicket, SupportTicketMessage } from "@/types/admin";
import { TicketDetailHeader } from "@/components/admin/support/ticket-detail-header";
import { TicketConversation } from "@/components/admin/support/ticket-conversation";
import { TicketReplyForm } from "@/components/admin/support/ticket-reply-form";

interface Props {
  params: { id: string };
}

export default async function TicketDetailPage({ params }: Props) {
  const supabase = createAdminClient();

  const [ticketResult, messagesResult, adminsResult] = await Promise.all([
    supabase
      .from("support_tickets")
      .select("*, tenant:tenants(*), assigned_admin:admin_users(*)")
      .eq("id", params.id)
      .single(),
    supabase
      .from("support_ticket_messages")
      .select("*")
      .eq("ticket_id", params.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("admin_users")
      .select("*")
      .eq("is_active", true)
      .order("display_name"),
  ]);

  if (!ticketResult.data) {
    notFound();
  }

  const ticket = ticketResult.data as SupportTicket;
  const messages = (messagesResult.data || []) as SupportTicketMessage[];
  const admins = adminsResult.data || [];

  const isClosed = ticket.status === "closed" || ticket.status === "resolved";

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-7rem)]">
      <TicketDetailHeader ticket={ticket} admins={admins} />

      <div className="flex-1 flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden min-h-0">
        <TicketConversation messages={messages} />
        <TicketReplyForm ticketId={ticket.id} isClosed={isClosed} />
      </div>
    </div>
  );
}
