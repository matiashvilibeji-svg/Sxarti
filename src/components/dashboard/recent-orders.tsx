import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatGEL } from "@/lib/utils/currency";
import type { Order } from "@/types/database";
import { format } from "date-fns";
import { ka } from "date-fns/locale";

const statusLabels: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  pending: { label: "მოლოდინში", variant: "outline" },
  confirmed: { label: "დადასტურებული", variant: "default" },
  shipped: { label: "გაგზავნილი", variant: "secondary" },
  delivered: { label: "მიტანილი", variant: "default" },
};

interface RecentOrdersProps {
  orders: Order[];
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">ბოლო შეკვეთები</CardTitle>
        <Link
          href="/dashboard/orders"
          className="text-sm text-primary hover:underline"
        >
          ყველას ნახვა
        </Link>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-on-surface-variant">
            შეკვეთები ჯერ არ არის
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>შეკვეთა</TableHead>
                <TableHead>მომხმარებელი</TableHead>
                <TableHead>თანხა</TableHead>
                <TableHead>სტატუსი</TableHead>
                <TableHead>თარიღი</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const status =
                  statusLabels[order.payment_status] ?? statusLabels.pending;
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.order_number}
                    </TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>{formatGEL(order.total)}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-on-surface-variant">
                      {format(new Date(order.created_at), "d MMM", {
                        locale: ka,
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
