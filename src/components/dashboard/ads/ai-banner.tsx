"use client";

import type { AdRecommendation } from "@/types/database";

interface AIBannerProps {
  topRecommendation: AdRecommendation | null;
  onViewAll: () => void;
}

export function AIBanner({ topRecommendation, onViewAll }: AIBannerProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#7531e6] p-8 text-white shadow-xl shadow-indigo-200">
      <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row">
        <div className="flex-1 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide backdrop-blur-xl">
            <span className="text-sm">&#10024;</span>
            AI რეკომენდაციები
          </div>
          {topRecommendation ? (
            <div className="space-y-3">
              <p className="text-xl font-medium leading-relaxed">
                {topRecommendation.title}
              </p>
              <p className="text-lg leading-relaxed opacity-90">
                {topRecommendation.description}
              </p>
            </div>
          ) : (
            <p className="text-lg leading-relaxed opacity-90">
              სინქრონიზაციის შემდეგ AI გამოიტანს პერსონალიზებულ რეკომენდაციებს
              შენი რეკლამების ოპტიმიზაციისთვის.
            </p>
          )}
        </div>
        <button
          onClick={onViewAll}
          aria-label="ყველა AI რეკომენდაციის ნახვა"
          className="whitespace-nowrap rounded-xl bg-white px-8 py-4 font-extrabold text-primary shadow-lg transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary active:scale-95"
        >
          ყველა რეკომენდაციის ნახვა
        </button>
      </div>
      {/* Decorative element */}
      <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
    </section>
  );
}
