"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  MessageCircle,
  ShoppingBag,
  Package,
  Truck,
  BarChart3,
  Brain,
  Sparkles,
  Settings,
  Loader2,
  Megaphone,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";

const navItems: {
  label: string;
  icon: typeof LayoutDashboard;
  href: string;
  badge?: string;
}[] = [
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
    label: "რეკლამების ანალიზი",
    icon: Megaphone,
    href: "/dashboard/ads-analytics",
  },
  {
    label: "AI ასისტენტი",
    icon: Brain,
    href: "/dashboard/ai-assistant",
  },
  {
    label: "AI ჩატი",
    icon: Sparkles,
    href: "/dashboard/ai-chat",
  },
  {
    label: "პარამეტრები",
    icon: Settings,
    href: "/dashboard/settings",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Clear pending state when navigation completes
  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-surface-container-lowest">
      <div className="flex h-16 items-center px-6">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const isPending = pendingHref === item.href && !isActive;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (!isActive) setPendingHref(item.href);
              }}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive || isPending
                  ? "bg-surface-container-high text-primary"
                  : "text-on-surface-variant hover:bg-surface-container-low",
                isPending && "animate-pulse",
              )}
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <item.icon className="h-5 w-5" />
              )}
              <span className="flex-1">{item.label}</span>
              {"badge" in item && item.badge && (
                <span className="rounded-full bg-[#7531e6] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
