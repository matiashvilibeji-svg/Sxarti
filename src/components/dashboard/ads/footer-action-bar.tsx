"use client";

import { useRouter } from "next/navigation";
import { MessageCircle, Download, SlidersHorizontal } from "lucide-react";

interface FooterActionBarProps {
  onExport: () => void;
}

export function FooterActionBar({ onExport }: FooterActionBarProps) {
  const router = useRouter();

  return (
    <footer className="flex flex-col items-center gap-6 rounded-2xl bg-[#0b1c30] p-6 text-white shadow-2xl sm:flex-row sm:justify-between sm:p-8">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
          <span className="text-2xl">&#10024;</span>
        </div>
        <div>
          <p className="text-lg font-bold">გჭირდება უფრო ღრმა ანალიზი?</p>
          <p className="text-xs text-slate-400">
            დასვი კითხვა ნებისმიერ მონაცემზე
          </p>
        </div>
      </div>
      <div className="flex w-full items-center gap-3 sm:w-auto">
        <button
          onClick={() => router.push("/dashboard/ai-chat")}
          aria-label="AI ჩატში განხილვა"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-extrabold text-on-surface transition-all hover:bg-surface-container-highest sm:flex-initial"
        >
          <MessageCircle className="h-4 w-4" />
          AI ჩატში განხილვა
        </button>
        <button
          onClick={onExport}
          aria-label="ანგარიშის ექსპორტი CSV ფორმატში"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-extrabold text-white transition-all hover:bg-white/20 sm:flex-initial"
        >
          <Download className="h-4 w-4" />
          ანგარიშის ექსპორტი
        </button>
        <button
          onClick={() => router.push("/dashboard/settings")}
          aria-label="პარამეტრები"
          className="rounded-xl border border-white/20 bg-white/10 p-3 text-white transition-all hover:bg-white/20"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>
    </footer>
  );
}
