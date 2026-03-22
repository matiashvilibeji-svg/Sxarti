"use client";

import { Bell } from "lucide-react";

import { cn } from "@/lib/utils";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  return (
    <header
      className={cn(
        "fixed left-64 right-0 top-0 z-20 flex h-16 items-center justify-between bg-surface-container-lowest px-6 shadow-ambient-sm",
        className,
      )}
    >
      <div className="text-sm font-medium text-on-surface">ჩემი ბიზნესი</div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low"
          aria-label="შეტყობინებები"
        >
          <Bell className="h-5 w-5" />
        </button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-high text-sm font-semibold text-primary">
          ბმ
        </div>
      </div>
    </header>
  );
}
