"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageCircle,
  ShoppingBag,
  Package,
  Truck,
  BarChart3,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";

const navItems = [
  {
    label: "მიმოხილვა",
    icon: LayoutDashboard,
    href: "/dashboard/overview",
  },
  {
    label: "საუბრები",
    icon: MessageCircle,
    href: "/dashboard/conversations",
  },
  {
    label: "შეკვეთები",
    icon: ShoppingBag,
    href: "/dashboard/orders",
  },
  {
    label: "პროდუქტები",
    icon: Package,
    href: "/dashboard/products",
  },
  {
    label: "მიწოდება",
    icon: Truck,
    href: "/dashboard/delivery-zones",
  },
  {
    label: "ანალიტიკა",
    icon: BarChart3,
    href: "/dashboard/analytics",
  },
  {
    label: "პარამეტრები",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-surface-container-lowest">
      <div className="flex h-16 items-center px-6">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-surface-container-high text-primary"
                  : "text-on-surface-variant hover:bg-surface-container-low",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
