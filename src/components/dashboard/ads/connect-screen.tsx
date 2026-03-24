"use client";

import { useState } from "react";
import { BarChart3, MessageCircle, Sparkles, Shield } from "lucide-react";

export function ConnectScreen() {
  const [loading, setLoading] = useState(false);

  const handleConnect = () => {
    setLoading(true);
    window.location.href = "/api/ads/connect";
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="max-w-xl text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#7531e6] shadow-xl shadow-primary/20">
          <BarChart3 className="h-10 w-10 text-white" />
        </div>

        <h2 className="mb-3 text-3xl font-black text-on-surface">
          რეკლამების ანალიზი
        </h2>
        <p className="mb-8 text-base text-on-surface-variant">
          დააკავშირე შენი Facebook Ads ანგარიში და მიიღე AI-ზე დაფუძნებული
          ანალიტიკა და რეკომენდაციები.
        </p>

        <div className="mb-8 grid gap-4 text-left sm:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <BarChart3 className="mb-3 h-6 w-6 text-primary" />
            <h3 className="mb-1 text-sm font-bold text-on-surface">
              სრული ანალიტიკა
            </h3>
            <p className="text-xs text-on-surface-variant">
              კამპანიების, აუდიტორიის და კონვერსიების დეტალური ანალიზი
            </p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <MessageCircle className="mb-3 h-6 w-6 text-[#006c49]" />
            <h3 className="mb-1 text-sm font-bold text-on-surface">
              საუბრების კორელაცია
            </h3>
            <p className="text-xs text-on-surface-variant">
              რეკლამებს და Messenger საუბრებს შორის კავშირის აღმოჩენა
            </p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <Sparkles className="mb-3 h-6 w-6 text-[#5c00ca]" />
            <h3 className="mb-1 text-sm font-bold text-on-surface">
              AI რეკომენდაციები
            </h3>
            <p className="text-xs text-on-surface-variant">
              ინტელექტუალური რჩევები ბიუჯეტის და კრეატივების ოპტიმიზაციისთვის
            </p>
          </div>
        </div>

        <button
          onClick={handleConnect}
          disabled={loading}
          aria-label="Facebook Ads ანგარიშის დაკავშირება"
          className="inline-flex items-center gap-3 rounded-xl bg-[#1877F2] px-8 py-4 text-base font-extrabold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[#1877F2] focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50"
        >
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          {loading ? "მიმდინარეობს..." : "Facebook Ads-ის დაკავშირება"}
        </button>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-on-surface-variant">
          <Shield className="h-3.5 w-3.5" />
          <span>
            მხოლოდ წაკითხვის უფლება — სხარტი ვერასდროს შეცვლის შენს რეკლამებს
          </span>
        </div>
      </div>
    </div>
  );
}
