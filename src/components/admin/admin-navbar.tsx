"use client";

import { Bell, Search } from "lucide-react";

import { cn } from "@/lib/utils";

interface AdminNavbarProps {
  className?: string;
}

export function AdminNavbar({ className }: AdminNavbarProps) {
  return (
    <header
      className={cn(
        "fixed left-64 right-0 top-0 z-20 flex h-16 items-center justify-between bg-surface-container-lowest px-6 shadow-ambient-sm",
        className,
      )}
    >
      <div className="text-sm font-medium text-on-surface">Sxarti Admin</div>

      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full rounded-lg bg-surface-container-low py-2 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high text-sm font-semibold text-primary">
          SA
        </div>
      </div>
    </header>
  );
}
