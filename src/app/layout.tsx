import type { Metadata } from "next";

import "@/styles/globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "სხარტი - AI გაყიდვების ასისტენტი",
  description:
    "სხარტი - ხელოვნური ინტელექტის გაყიდვების ასისტენტი ქართული ბიზნესისთვის",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ka">
      <body className="font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
