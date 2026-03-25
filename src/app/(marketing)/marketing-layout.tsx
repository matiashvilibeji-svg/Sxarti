"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Logo } from "@/components/shared/logo";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      <header className="flex h-16 items-center justify-between px-4 md:px-6">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
          >
            მთავარი
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
          >
            ფასები
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            შესვლა
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg p-2 text-on-surface-variant md:hidden"
          aria-label="მენიუ"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile nav dropdown */}
      {menuOpen && (
        <nav className="flex flex-col gap-2 border-b border-outline-variant/15 px-4 pb-4 md:hidden">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            მთავარი
          </Link>
          <Link
            href="/pricing"
            onClick={() => setMenuOpen(false)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
          >
            ფასები
          </Link>
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-surface-container-low"
          >
            შესვლა
          </Link>
        </nav>
      )}

      {children}

      <footer className="border-t border-outline-variant/15 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-on-surface-variant">
            &copy; 2026 სხარტი. ყველა უფლება დაცულია.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-on-surface-variant transition-colors hover:text-on-surface"
            >
              Facebook
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-on-surface-variant transition-colors hover:text-on-surface"
            >
              Instagram
            </a>
            <a
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-on-surface-variant transition-colors hover:text-on-surface"
            >
              Telegram
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
