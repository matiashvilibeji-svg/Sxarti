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
  Menu,
  Gift,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

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
    label: "ავტომატიზაცია",
    icon: Zap,
    href: "/dashboard/orders/rules",
  },
  {
    label: "პროდუქტები",
    icon: Package,
    href: "/dashboard/products",
  },
  {
    label: "ბანდლები",
    icon: Gift,
    href: "/dashboard/bundles",
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

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  return (
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
              onNavigate?.();
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
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low md:hidden"
        aria-label="მენიუ"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 md:hidden">
          <SheetTitle className="sr-only">ნავიგაცია</SheetTitle>
          <div className="flex h-16 items-center px-6">
            <Logo />
          </div>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col bg-surface-container-lowest md:flex">
        <div className="flex h-16 items-center px-6">
          <Logo />
        </div>
        <SidebarNav />
      </aside>
    </>
  );
}
