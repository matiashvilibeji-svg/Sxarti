"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Facebook,
  Instagram,
  Bot,
  Calendar,
  MessageCircle,
  CreditCard,
} from "lucide-react";
import type { Tenant } from "@/types/database";

const PLAN_LIMITS: Record<Tenant["subscription_plan"], number> = {
  starter: 500,
  business: 2000,
  premium: 10000,
};

const planBadge: Record<
  Tenant["subscription_plan"],
  { label: string; className: string }
> = {
  starter: {
    label: "Starter",
    className: "bg-secondary text-secondary-foreground",
  },
  business: { label: "Business", className: "bg-blue-500/15 text-blue-700" },
  premium: { label: "Premium", className: "bg-purple-500/15 text-purple-700" },
};

const statusBadge: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-500/15 text-green-700" },
  trial: { label: "Trial", className: "bg-amber-500/15 text-amber-700" },
  expired: { label: "Expired", className: "bg-red-500/15 text-red-700" },
  suspended: {
    label: "Suspended",
    className: "bg-secondary text-secondary-foreground",
  },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface BusinessDetailModalProps {
  business: (Tenant & { owner_email?: string }) | null;
  onClose: () => void;
}

export function BusinessDetailModal({
  business,
  onClose,
}: BusinessDetailModalProps) {
  if (!business) return null;

  const limit = PLAN_LIMITS[business.subscription_plan];
  const usagePercent = Math.round(
    (business.conversations_this_month / limit) * 100,
  );

  return (
    <Dialog open={!!business} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {business.logo_url && (
                <AvatarImage
                  src={business.logo_url}
                  alt={business.business_name}
                />
              )}
              <AvatarFallback>
                {getInitials(business.business_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>{business.business_name}</DialogTitle>
              <DialogDescription>
                {business.owner_email ?? "No email"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Subscription */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-on-surface">
            <CreditCard className="h-4 w-4" />
            Subscription
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-on-surface-variant">Plan</span>
              <div className="mt-1">
                <Badge
                  className={planBadge[business.subscription_plan].className}
                >
                  {planBadge[business.subscription_plan].label}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-on-surface-variant">Status</span>
              <div className="mt-1">
                <Badge
                  className={
                    (
                      statusBadge[business.subscription_status] ??
                      statusBadge.active
                    ).className
                  }
                >
                  {
                    (
                      statusBadge[business.subscription_status] ??
                      statusBadge.active
                    ).label
                  }
                </Badge>
              </div>
            </div>
            {business.trial_ends_at && (
              <div>
                <span className="text-on-surface-variant">Trial Ends</span>
                <p className="mt-1 font-medium text-on-surface">
                  {new Date(business.trial_ends_at).toLocaleDateString()}
                </p>
              </div>
            )}
            <div>
              <span className="text-on-surface-variant">Conversations</span>
              <p className="mt-1 font-medium text-on-surface">
                {business.conversations_this_month} / {limit}{" "}
                <span className="text-xs text-on-surface-variant">
                  ({usagePercent}%)
                </span>
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Connected Platforms */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-on-surface">
            <MessageCircle className="h-4 w-4" />
            Connected Platforms
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Facebook className="h-4 w-4 text-blue-600" />
              <span
                className={
                  business.facebook_page_id
                    ? "text-green-600"
                    : "text-on-surface-variant"
                }
              >
                {business.facebook_page_id ? "Connected" : "Not connected"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-pink-600" />
              <span
                className={
                  business.instagram_account_id
                    ? "text-green-600"
                    : "text-on-surface-variant"
                }
              >
                {business.instagram_account_id ? "Connected" : "Not connected"}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Bot Configuration */}
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-on-surface">
            <Bot className="h-4 w-4" />
            Bot Configuration
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-on-surface-variant">Persona Name</span>
              <p className="mt-1 font-medium text-on-surface">
                {business.bot_persona_name}
              </p>
            </div>
            <div>
              <span className="text-on-surface-variant">Tone</span>
              <p className="mt-1 font-medium capitalize text-on-surface">
                {business.bot_tone}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Dates */}
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            Created {new Date(business.created_at).toLocaleDateString()}
          </span>
          <span>·</span>
          <span>
            Updated {new Date(business.updated_at).toLocaleDateString()}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
