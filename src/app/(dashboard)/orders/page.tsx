"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Download,
  ShoppingBag,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { ka } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { Loading } from "@/components/shared/loading";
import { useSupabase } from "@/hooks/use-supabase";
import { useTenant } from "@/hooks/use-tenant";
import { formatGEL } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import type { Order } from "@/types/database";

type SortField =
  | "order_number"
  | "customer_name"
  | "total"
  | "payment_status"
  | "delivery_status"
  | "created_at";

const paymentLabels: Record<string, { label: string; className: string }> = {
  pending: { label: "მოლოდინში", className: "bg-amber-100 text-amber-700" },
  confirmed: {
    label: "დადასტურებული",
    className: "bg-secondary/10 text-secondary",
  },
};

const deliveryLabels: Record<string, { label: string; className: string }> = {
  pending: { label: "მოლოდინში", className: "bg-amber-100 text-amber-700" },
  shipped: { label: "გაგზავნილი", className: "bg-blue-100 text-blue-700" },
  delivered: {
    label: "მიწოდებული",
    className: "bg-secondary/10 text-secondary",
  },
};

export default function OrdersPage() {
  const supabase = useSupabase();
  const { tenant, loading: tenantLoading } = useTenant();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [deliveryFilter, setDeliveryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!tenant) return;
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false });
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  }, [supabase, tenant]);

  useEffect(() => {
    if (tenant) fetchOrders();
  }, [tenant, fetchOrders]);

  const handleStatusUpdate = async (
    orderId: string,
    field: "payment_status" | "delivery_status",
    value: string,
  ) => {
    await supabase
      .from("orders")
      .update({ [field]: value })
      .eq("id", orderId);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, [field]: value } : o)),
    );
  };

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ArrowUpDown className="ml-1 h-3 w-3" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  const filteredOrders = useMemo(() => {
    let result = orders;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.includes(q),
      );
    }

    if (paymentFilter !== "all") {
      result = result.filter((o) => o.payment_status === paymentFilter);
    }

    if (deliveryFilter !== "all") {
      result = result.filter((o) => o.delivery_status === deliveryFilter);
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "total") {
        cmp = a.total - b.total;
      } else if (sortBy === "created_at") {
        cmp =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        cmp = String(a[sortBy]).localeCompare(String(b[sortBy]));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [orders, searchQuery, paymentFilter, deliveryFilter, sortBy, sortDir]);

  const exportCSV = () => {
    const headers = [
      "შეკვეთა #",
      "მომხმარებელი",
      "ტელეფონი",
      "მისამართი",
      "ჯამი",
      "გადახდა",
      "მიწოდება",
      "თარიღი",
    ];
    const rows = filteredOrders.map((o) => [
      o.order_number,
      o.customer_name,
      o.customer_phone,
      o.customer_address,
      o.total.toFixed(2),
      paymentLabels[o.payment_status]?.label ?? o.payment_status,
      deliveryLabels[o.delivery_status]?.label ?? o.delivery_status,
      format(new Date(o.created_at), "yyyy-MM-dd HH:mm"),
    ]);

    const csv =
      "\uFEFF" +
      [headers, ...rows]
        .map((r) => r.map((c) => `"${c}"`).join(","))
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (tenantLoading) return <Loading />;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-display text-on-surface">
          შეკვეთები
        </h1>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="mr-2 h-4 w-4" />
          CSV-ის ჩამოტვირთვა
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ძიება..."
            className="pl-9"
          />
        </div>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="გადახდა" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ყველა გადახდა</SelectItem>
            <SelectItem value="pending">მოლოდინში</SelectItem>
            <SelectItem value="confirmed">დადასტურებული</SelectItem>
          </SelectContent>
        </Select>
        <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="მიწოდება" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ყველა მიწოდება</SelectItem>
            <SelectItem value="pending">მოლოდინში</SelectItem>
            <SelectItem value="shipped">გაგზავნილი</SelectItem>
            <SelectItem value="delivered">მიწოდებული</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Loading />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="შეკვეთები ჯერ არ არის"
          description="როდესაც მომხმარებლები შეკვეთებს გააკეთებენ, ისინი აქ გამოჩნდება"
        />
      ) : (
        <div className="rounded-lg bg-surface-container-lowest ghost-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>
                  <button
                    className="flex items-center font-medium"
                    onClick={() => toggleSort("order_number")}
                  >
                    შეკვეთა #
                    <SortIcon field="order_number" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center font-medium"
                    onClick={() => toggleSort("customer_name")}
                  >
                    მომხმარებელი
                    <SortIcon field="customer_name" />
                  </button>
                </TableHead>
                <TableHead>ნივთები</TableHead>
                <TableHead>
                  <button
                    className="flex items-center font-medium"
                    onClick={() => toggleSort("total")}
                  >
                    ჯამი (₾)
                    <SortIcon field="total" />
                  </button>
                </TableHead>
                <TableHead>გადახდა</TableHead>
                <TableHead>მიწოდება</TableHead>
                <TableHead>
                  <button
                    className="flex items-center font-medium"
                    onClick={() => toggleSort("created_at")}
                  >
                    თარიღი
                    <SortIcon field="created_at" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                return (
                  <OrderRow
                    key={order.id}
                    order={order}
                    isExpanded={isExpanded}
                    onToggle={() =>
                      setExpandedOrderId(isExpanded ? null : order.id)
                    }
                    onStatusUpdate={handleStatusUpdate}
                  />
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function OrderRow({
  order,
  isExpanded,
  onToggle,
  onStatusUpdate,
}: {
  order: Order;
  isExpanded: boolean;
  onToggle: () => void;
  onStatusUpdate: (
    orderId: string,
    field: "payment_status" | "delivery_status",
    value: string,
  ) => void;
}) {
  const paymentStatus = paymentLabels[order.payment_status];
  const deliveryStatus = deliveryLabels[order.delivery_status];

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-surface-container-low/50"
        onClick={onToggle}
      >
        <TableCell className="w-8">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-on-surface-variant" />
          ) : (
            <ChevronRight className="h-4 w-4 text-on-surface-variant" />
          )}
        </TableCell>
        <TableCell className="font-medium">{order.order_number}</TableCell>
        <TableCell>{order.customer_name}</TableCell>
        <TableCell className="text-on-surface-variant">
          {order.items.length} ნივთი
        </TableCell>
        <TableCell className="font-medium">{formatGEL(order.total)}</TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Select
            value={order.payment_status}
            onValueChange={(v) => onStatusUpdate(order.id, "payment_status", v)}
          >
            <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-transparent p-0">
              <Badge
                className={cn("pointer-events-none", paymentStatus?.className)}
              >
                {paymentStatus?.label}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">მოლოდინში</SelectItem>
              <SelectItem value="confirmed">დადასტურებული</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Select
            value={order.delivery_status}
            onValueChange={(v) =>
              onStatusUpdate(order.id, "delivery_status", v)
            }
          >
            <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-transparent p-0">
              <Badge
                className={cn("pointer-events-none", deliveryStatus?.className)}
              >
                {deliveryStatus?.label}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">მოლოდინში</SelectItem>
              <SelectItem value="shipped">გაგზავნილი</SelectItem>
              <SelectItem value="delivered">მიწოდებული</SelectItem>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="text-on-surface-variant">
          {format(new Date(order.created_at), "d MMM, HH:mm", { locale: ka })}
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="bg-surface-container-low/30">
          <TableCell colSpan={8} className="p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="mb-2 text-sm font-semibold text-on-surface">
                  ნივთები
                </h4>
                <div className="space-y-1.5">
                  {order.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-on-surface">
                        {item.name}
                        {item.variant && (
                          <span className="text-on-surface-variant">
                            {" "}
                            ({item.variant})
                          </span>
                        )}
                        <span className="text-on-surface-variant">
                          {" "}
                          x{item.quantity}
                        </span>
                      </span>
                      <span className="font-medium">
                        {formatGEL(item.unit_price * item.quantity)}
                      </span>
                    </div>
                  ))}
                  {order.delivery_fee > 0 && (
                    <div className="flex items-center justify-between border-t border-outline/10 pt-1.5 text-sm">
                      <span className="text-on-surface-variant">მიწოდება</span>
                      <span>{formatGEL(order.delivery_fee)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-outline/10 pt-1.5 text-sm font-semibold">
                    <span>ჯამი</span>
                    <span>{formatGEL(order.total)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-semibold text-on-surface">
                  მომხმარებლის ინფორმაცია
                </h4>
                <div className="space-y-1 text-sm">
                  <p className="text-on-surface">{order.customer_name}</p>
                  <p className="text-on-surface-variant">
                    {order.customer_phone}
                  </p>
                  <p className="text-on-surface-variant">
                    {order.customer_address}
                  </p>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
