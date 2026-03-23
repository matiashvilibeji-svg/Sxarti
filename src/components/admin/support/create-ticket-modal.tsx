"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminUser } from "@/types/admin";
import { Tenant } from "@/types/database";
import { createTicket } from "@/app/admin/support/actions";

interface CreateTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admins: AdminUser[];
  tenants: Tenant[];
}

export function CreateTicketModal({
  open,
  onOpenChange,
  admins,
  tenants,
}: CreateTicketModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tenantId, setTenantId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("");
  const [assignedAdminId, setAssignedAdminId] = useState("");

  const resetForm = () => {
    setTenantId("");
    setSubject("");
    setDescription("");
    setPriority("medium");
    setCategory("");
    setAssignedAdminId("");
  };

  const handleCreate = () => {
    if (!tenantId || !subject.trim()) return;
    startTransition(async () => {
      await createTicket({
        tenant_id: tenantId,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        category: category || null,
        assigned_admin_id: assignedAdminId || null,
      });
      resetForm();
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Support Ticket</DialogTitle>
          <DialogDescription>
            Create a ticket on behalf of a business.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tenant">Business</Label>
            <Select value={tenantId} onValueChange={setTenantId}>
              <SelectTrigger>
                <SelectValue placeholder="Select business..." />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.business_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of the issue"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Full details..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="bot">Bot</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="feature_request">
                    Feature Request
                  </SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Assign To (optional)</Label>
            <Select value={assignedAdminId} onValueChange={setAssignedAdminId}>
              <SelectTrigger>
                <SelectValue placeholder="Leave unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {admins.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id}>
                    {admin.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!tenantId || !subject.trim() || isPending}
          >
            {isPending ? "Creating..." : "Create Ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
