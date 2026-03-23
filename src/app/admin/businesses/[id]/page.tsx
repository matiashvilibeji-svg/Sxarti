import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAdminUser } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Facebook,
  Instagram,
  Bot,
  MessageCircle,
  ShoppingCart,
  CreditCard,
} from "lucide-react";

const PLAN_LIMITS: Record<string, number> = {
  starter: 500,
  business: 2000,
  premium: 10000,
};

const planBadge: Record<string, { label: string; className: string }> = {
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

export default async function BusinessDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = await getAdminUser();
  if (!admin) redirect("/login");

  const supabase = createAdminClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!tenant) notFound();

  // Fetch owner email
  let ownerEmail = "—";
  const { data: userData } = await supabase.auth.admin.getUserById(
    tenant.owner_id,
  );
  if (userData?.user?.email) ownerEmail = userData.user.email;

  // Fetch recent conversations
  const { data: conversations, count: convCount } = await supabase
    .from("conversations")
    .select(
      "id, platform, customer_name, status, current_stage, started_at, last_message_at",
      { count: "exact" },
    )
    .eq("tenant_id", tenant.id)
    .order("started_at", { ascending: false })
    .limit(10);

  // Fetch recent orders
  const { data: orders, count: orderCount } = await supabase
    .from("orders")
    .select(
      "id, order_number, customer_name, total, payment_status, delivery_status, created_at",
      { count: "exact" },
    )
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const limit = PLAN_LIMITS[tenant.subscription_plan] ?? 500;
  const usagePercent = Math.round(
    (tenant.conversations_this_month / limit) * 100,
  );
  const plan = planBadge[tenant.subscription_plan] ?? planBadge.starter;
  const status = statusBadge[tenant.subscription_status] ?? statusBadge.active;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/businesses">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Businesses
          </Link>
        </Button>
        <span className="text-on-surface-variant">/</span>
        <span className="text-sm font-medium text-on-surface">
          {tenant.business_name}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          {tenant.logo_url && (
            <AvatarImage src={tenant.logo_url} alt={tenant.business_name} />
          )}
          <AvatarFallback className="text-lg">
            {getInitials(tenant.business_name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold tracking-display text-on-surface">
            {tenant.business_name}
          </h1>
          <p className="text-sm text-on-surface-variant">{ownerEmail}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge className={plan.className}>{plan.label}</Badge>
          <Badge className={status.className}>{status.label}</Badge>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
              <CreditCard className="h-4 w-4" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Plan</span>
              <Badge className={plan.className}>{plan.label}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Status</span>
              <Badge className={status.className}>{status.label}</Badge>
            </div>
            {tenant.trial_ends_at && (
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Trial Ends</span>
                <span className="font-medium text-on-surface">
                  {new Date(tenant.trial_ends_at).toLocaleDateString()}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Conversations</span>
              <span className="font-medium text-on-surface">
                {tenant.conversations_this_month} / {limit} ({usagePercent}%)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
              <MessageCircle className="h-4 w-4" />
              Connected Platforms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Facebook className="h-4 w-4 text-blue-600" />
              <span
                className={
                  tenant.facebook_page_id
                    ? "text-green-600"
                    : "text-on-surface-variant"
                }
              >
                {tenant.facebook_page_id ? "Connected" : "Not connected"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-pink-600" />
              <span
                className={
                  tenant.instagram_account_id
                    ? "text-green-600"
                    : "text-on-surface-variant"
                }
              >
                {tenant.instagram_account_id ? "Connected" : "Not connected"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
              <Bot className="h-4 w-4" />
              Bot Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Persona</span>
              <span className="font-medium text-on-surface">
                {tenant.bot_persona_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Tone</span>
              <span className="font-medium capitalize text-on-surface">
                {tenant.bot_tone}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Conversations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4" />
            Recent Conversations
            <Badge variant="secondary" className="ml-auto">
              {convCount ?? 0} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {conversations && conversations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Last Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.map((conv) => (
                  <TableRow key={conv.id}>
                    <TableCell className="font-medium">
                      {conv.customer_name ?? "Unknown"}
                    </TableCell>
                    <TableCell className="capitalize">
                      {conv.platform}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {conv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-on-surface-variant">
                      {conv.current_stage}
                    </TableCell>
                    <TableCell className="text-on-surface-variant">
                      {new Date(conv.last_message_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-sm text-on-surface-variant">
              No conversations yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4" />
            Recent Orders
            <Badge variant="secondary" className="ml-auto">
              {orderCount ?? 0} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders && orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.order_number}
                    </TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>{order.total.toFixed(2)} GEL</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {order.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {order.delivery_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-on-surface-variant">
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-sm text-on-surface-variant">
              No orders yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Meta */}
      <div className="text-xs text-on-surface-variant">
        Created {new Date(tenant.created_at).toLocaleString()} · Updated{" "}
        {new Date(tenant.updated_at).toLocaleString()}
      </div>
    </div>
  );
}
