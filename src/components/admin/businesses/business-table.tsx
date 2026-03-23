"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle,
  ArrowUpDown,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { BusinessDetailModal } from "./business-detail-modal";
import type { Tenant } from "@/types/database";

type SortKey =
  | "business_name"
  | "subscription_plan"
  | "conversations_this_month"
  | "created_at";
type SortDir = "asc" | "desc";

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

interface BusinessTableProps {
  businesses: (Tenant & { owner_email?: string })[];
}

export function BusinessTable({ businesses }: BusinessTableProps) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedBusiness, setSelectedBusiness] = useState<
    (Tenant & { owner_email?: string }) | null
  >(null);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...businesses].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortKey === "business_name")
      return a.business_name.localeCompare(b.business_name) * dir;
    if (sortKey === "subscription_plan")
      return a.subscription_plan.localeCompare(b.subscription_plan) * dir;
    if (sortKey === "conversations_this_month")
      return (a.conversations_this_month - b.conversations_this_month) * dir;
    if (sortKey === "created_at")
      return (
        (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) *
        dir
      );
    return 0;
  });

  const SortButton = ({ label, field }: { label: string; field: SortKey }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 font-medium"
    >
      {label}
      <ArrowUpDown className="h-3.5 w-3.5 text-on-surface-variant" />
    </button>
  );

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortButton label="Business Name" field="business_name" />
                </TableHead>
                <TableHead>Owner Email</TableHead>
                <TableHead>
                  <SortButton label="Plan" field="subscription_plan" />
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <SortButton
                    label="Conversations"
                    field="conversations_this_month"
                  />
                </TableHead>
                <TableHead>
                  <SortButton label="Created" field="created_at" />
                </TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-on-surface-variant"
                  >
                    No businesses found.
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((biz) => (
                  <TableRow key={biz.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {biz.logo_url && (
                            <AvatarImage
                              src={biz.logo_url}
                              alt={biz.business_name}
                            />
                          )}
                          <AvatarFallback className="text-xs">
                            {getInitials(biz.business_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-on-surface">
                          {biz.business_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-on-surface-variant">
                      {biz.owner_email ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={planBadge[biz.subscription_plan].className}
                      >
                        {planBadge[biz.subscription_plan].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          (
                            statusBadge[biz.subscription_status] ??
                            statusBadge.active
                          ).className
                        }
                      >
                        {
                          (
                            statusBadge[biz.subscription_status] ??
                            statusBadge.active
                          ).label
                        }
                      </Badge>
                    </TableCell>
                    <TableCell className="text-on-surface-variant">
                      {biz.conversations_this_month}
                    </TableCell>
                    <TableCell className="text-on-surface-variant">
                      {new Date(biz.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setSelectedBusiness(biz)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/admin/businesses/${biz.id}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Full Page
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {biz.subscription_status === "suspended" ? (
                            <DropdownMenuItem>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Activate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-red-600">
                              <Ban className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {sorted.length === 0 ? (
          <Card className="p-8 text-center text-on-surface-variant">
            No businesses found.
          </Card>
        ) : (
          sorted.map((biz) => (
            <Card
              key={biz.id}
              className="cursor-pointer p-4 transition-colors hover:bg-surface-container-low"
              onClick={() => setSelectedBusiness(biz)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    {biz.logo_url && (
                      <AvatarImage src={biz.logo_url} alt={biz.business_name} />
                    )}
                    <AvatarFallback className="text-xs">
                      {getInitials(biz.business_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-on-surface">
                      {biz.business_name}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {biz.owner_email ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className={planBadge[biz.subscription_plan].className}>
                    {planBadge[biz.subscription_plan].label}
                  </Badge>
                  <Badge
                    className={
                      (
                        statusBadge[biz.subscription_status] ??
                        statusBadge.active
                      ).className
                    }
                  >
                    {
                      (
                        statusBadge[biz.subscription_status] ??
                        statusBadge.active
                      ).label
                    }
                  </Badge>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-on-surface-variant">
                <span>{biz.conversations_this_month} conversations</span>
                <span>{new Date(biz.created_at).toLocaleDateString()}</span>
              </div>
            </Card>
          ))
        )}
      </div>

      <BusinessDetailModal
        business={selectedBusiness}
        onClose={() => setSelectedBusiness(null)}
      />
    </>
  );
}
