"use client";

import { Sparkles } from "lucide-react";
import type { Tenant } from "@/types/database";

interface PremiumGateProps {
  subscriptionPlan: Tenant["subscription_plan"];
  children: React.ReactNode;
}

export function PremiumGate({ children }: PremiumGateProps) {
  // Temporarily allow all plans access
  return <>{children}</>;

  return (
    <div className="relative min-h-[80vh]">
      {/* Blurred content behind */}
      <div className="pointer-events-none select-none blur-sm brightness-75">
        {children}
      </div>

      {/* Upgrade overlay */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="პრემიუმ გეგმის განახლების შეთავაზება"
          className="mx-4 max-w-lg rounded-2xl bg-white p-10 text-center shadow-2xl shadow-primary/10"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#7531e6]">
            <Sparkles className="h-8 w-8 text-white" />
          </div>

          <h2 className="mb-3 text-2xl font-black text-on-surface">
            რეკლამების ანალიზი
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
            AI-ზე დაფუძნებული რეკლამების ანალიტიკა, Meta Ads-თან ინტეგრაცია და
            ინტელექტუალური რეკომენდაციები ხელმისაწვდომია მხოლოდ პრემიუმ გეგმაზე.
          </p>

          <div className="mb-6 rounded-xl bg-surface-container-low p-4">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-black text-primary">299</span>
              <span className="text-lg font-bold text-on-surface-variant">
                ₾/თვე
              </span>
            </div>
            <p className="mt-1 text-xs text-on-surface-variant">
              პრემიუმ გეგმა
            </p>
          </div>

          <ul className="mb-8 space-y-2 text-left text-sm text-on-surface">
            <li className="flex items-center gap-2">
              <span className="text-[#006c49]">&#10003;</span>
              Meta Ads ინტეგრაცია და ავტო-სინქრონიზაცია
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#006c49]">&#10003;</span>
              AI რეკომენდაციები რეკლამების ოპტიმიზაციისთვის
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#006c49]">&#10003;</span>
              რეკლამა ↔ საუბრების კორელაცია
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#006c49]">&#10003;</span>
              აუდიტორიის ანალიზი და ექსპორტი
            </li>
          </ul>

          <a
            href="/dashboard/settings"
            aria-label="პრემიუმ გეგმის გააქტიურება"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-[#7531e6] px-8 py-4 text-base font-extrabold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            <Sparkles className="h-5 w-5" />
            გააქტიურე პრემიუმი
          </a>
        </div>
      </div>
    </div>
  );
}
