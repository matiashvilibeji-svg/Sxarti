"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";

interface InviteAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteAdminModal({
  open,
  onOpenChange,
}: InviteAdminModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("support");
  const [sending, setSending] = useState(false);

  async function handleInvite() {
    if (!email) return;
    setSending(true);
    // TODO: Implement invite via API
    await new Promise((r) => setTimeout(r, 600));
    setSending(false);
    setEmail("");
    setRole("support");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation email to add a new admin to the platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
              Email Address
            </Label>
            <Input
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">
              Role
            </Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin — Manage everything</SelectItem>
                <SelectItem value="support">
                  Support — Tickets & businesses
                </SelectItem>
                <SelectItem value="viewer">
                  Viewer — Read-only access
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-on-surface-variant">
              Super Admin role can only be assigned by existing Super Admins
              directly.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={sending || !email}
            className="flex items-center gap-2"
          >
            {sending ? "Sending..." : "Send Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
