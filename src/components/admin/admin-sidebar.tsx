"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Bot,
  FileText,
  ToggleLeft,
  LifeBuoy,
  Activity,
  Settings,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard Overview",
    icon: LayoutDashboard,
    href: "/admin/overview",
  },
  {
    label: "Businesses",
    icon: Building2,
    href: "/admin/businesses",
  },
  {
    label: "Subscriptions",
    icon: CreditCard,
    href: "/admin/billing",
  },
  {
    label: "Bot Monitor",
    icon: Bot,
    href: "/admin/bot-monitor",
  },
  {
    label: "CMS",
    icon: FileText,
    href: "/admin/cms",
  },
  {
    label: "Feature Flags",
    icon: ToggleLeft,
    href: "/admin/feature-flags",
  },
  {
    label: "Support",
    icon: LifeBuoy,
    href: "/admin/support",
  },
  {
    label: "System Health",
    icon: Activity,
    href: "/admin/system-health",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/admin/settings",
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-surface-container-lowest">
      <div className="flex h-16 items-center px-6">
        <span className="text-lg font-semibold tracking-display text-primary">
          Sxarti Admin
        </span>
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
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
