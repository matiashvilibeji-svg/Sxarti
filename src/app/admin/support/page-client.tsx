"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateTicketModal } from "@/components/admin/support/create-ticket-modal";
import { AdminUser } from "@/types/admin";
import { Tenant } from "@/types/database";

interface SupportPageClientProps {
  admins: AdminUser[];
  tenants: Tenant[];
}

export function SupportPageClient({ admins, tenants }: SupportPageClientProps) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setCreateOpen(true)}>
        <Plus className="h-4 w-4 mr-1.5" />
        New Ticket
      </Button>
      <CreateTicketModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        admins={admins}
        tenants={tenants}
      />
    </>
  );
}
