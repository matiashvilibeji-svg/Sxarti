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
  Menu,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

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

function AdminSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low md:hidden"
        aria-label="მენიუ"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 md:hidden">
          <SheetTitle className="sr-only">Admin ნავიგაცია</SheetTitle>
          <div className="flex h-16 items-center px-6">
            <span className="text-lg font-semibold tracking-display text-primary">
              Sxarti Admin
            </span>
          </div>
          <AdminSidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col bg-surface-container-lowest md:flex">
        <div className="flex h-16 items-center px-6">
          <span className="text-lg font-semibold tracking-display text-primary">
            Sxarti Admin
          </span>
        </div>
        <AdminSidebarNav />
      </aside>
    </>
  );
}
