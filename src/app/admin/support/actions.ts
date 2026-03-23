"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/admin/auth";
import { revalidatePath } from "next/cache";

export async function updateTicketStatus(ticketId: string, status: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const supabase = createAdminClient();
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "resolved" || status === "closed") {
    updateData.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("support_tickets")
    .update(updateData)
    .eq("id", ticketId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);
}

export async function updateTicketPriority(ticketId: string, priority: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("support_tickets")
    .update({ priority, updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);
}

export async function assignTicket(ticketId: string, adminId: string | null) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("support_tickets")
    .update({
      assigned_admin_id: adminId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);
}

export async function sendReply(
  ticketId: string,
  content: string,
  closeAfter?: boolean,
) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const supabase = createAdminClient();

  const { error: msgError } = await supabase
    .from("support_ticket_messages")
    .insert({
      ticket_id: ticketId,
      sender_type: "admin",
      sender_id: admin.id,
      content,
    });

  if (msgError) throw new Error(msgError.message);

  const ticketUpdate: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (closeAfter) {
    ticketUpdate.status = "closed";
    ticketUpdate.resolved_at = new Date().toISOString();
  } else {
    ticketUpdate.status = "in_progress";
  }

  await supabase
    .from("support_tickets")
    .update(ticketUpdate)
    .eq("id", ticketId);

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);
}

export async function createTicket(formData: {
  tenant_id: string;
  subject: string;
  description: string;
  priority: string;
  category: string | null;
  assigned_admin_id: string | null;
}) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  const supabase = createAdminClient();
  const { error } = await supabase.from("support_tickets").insert({
    tenant_id: formData.tenant_id,
    subject: formData.subject,
    description: formData.description,
    priority: formData.priority,
    category: formData.category,
    assigned_admin_id: formData.assigned_admin_id,
    status: "open",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/support");
}
