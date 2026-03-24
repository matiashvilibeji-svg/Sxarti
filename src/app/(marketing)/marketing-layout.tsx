import Link from "next/link";

import { Logo } from "@/components/shared/logo";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="flex h-16 items-center justify-between px-6">
        <Logo />
        <nav className="flex items-center gap-6">
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
      </header>

      {children}

      <footer className="border-t border-outline-variant/15 px-6 py-8">
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
