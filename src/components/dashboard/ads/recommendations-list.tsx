"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdRecommendation } from "@/types/database";

interface RecommendationsListProps {
  recommendations: AdRecommendation[];
  onDiscussInChat: (context?: string) => void;
}

const priorityStyles: Record<string, string> = {
  high: "bg-[#ffdad6]/30 border-l-4 border-[#ba1a1a]",
  medium: "bg-surface-container-low border-l-4 border-primary",
  low: "bg-surface-container-low border-l-4 border-[#006c49]",
};

const priorityLabels: Record<string, { text: string; color: string }> = {
  high: { text: "High", color: "text-[#ba1a1a]" },
  medium: { text: "Medium", color: "text-primary" },
  low: { text: "Low", color: "text-[#006c49]" },
};

const categoryLabels: Record<string, string> = {
  budget: "ბიუჯეტი",
  creative: "კრეატივი",
  audience: "აუდიტორია",
  timing: "დროის მართვა",
  product: "პროდუქტი",
};

const priorityEmoji: Record<string, string> = {
  high: "\uD83D\uDD34",
  medium: "\uD83D\uDFE1",
  low: "\uD83D\uDFE2",
};

const priorityOrder: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function RecommendationsList({
  recommendations,
  onDiscussInChat,
}: RecommendationsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = [...recommendations].sort(
    (a, b) =>
      (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1),
  );

  const allContext = sorted
    .map((r) => `[${r.priority}] ${r.title}: ${r.description}`)
    .join("\n");

  return (
    <section className="rounded-2xl border border-[#e2dfff] bg-white/80 p-8 shadow-sm backdrop-blur-sm">
      <h4 className="mb-6 flex items-center gap-2 text-xl font-bold text-on-surface">
        <span className="text-[#5c00ca]">&#9889;</span>
        სამოქმედო გეგმა
      </h4>

      <div className="space-y-4">
        {sorted.map((rec) => {
          const isExpanded = expandedId === rec.id;
          const hasData =
            rec.supporting_data && Object.keys(rec.supporting_data).length > 0;

          return (
            <div
              key={rec.id}
              className={cn(
                "rounded-xl p-4",
                priorityStyles[rec.priority] ?? priorityStyles.medium,
              )}
            >
              <div className="mb-2 flex items-start justify-between">
                <span
                  className={cn(
                    "text-xs font-black uppercase tracking-tighter",
                    priorityLabels[rec.priority]?.color ?? "text-primary",
                  )}
                >
                  {priorityEmoji[rec.priority]}{" "}
                  {categoryLabels[rec.category] ?? rec.category} (
                  {priorityLabels[rec.priority]?.text ?? rec.priority})
                </span>
                {hasData && (
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                    className="text-on-surface-variant hover:text-on-surface"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
              <p className="text-sm font-medium leading-snug text-on-surface">
                {rec.description}
              </p>

              {isExpanded && rec.supporting_data && (
                <div className="mt-3 rounded-lg bg-white/60 p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    მხარდამჭერი მონაცემები
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(rec.supporting_data).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="font-bold text-on-surface-variant">
                          {key}:
                        </span>{" "}
                        <span className="font-medium text-on-surface">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {recommendations.length === 0 && (
          <p className="py-4 text-center text-sm text-on-surface-variant">
            რეკომენდაციები ჯერ არ არის. სინქრონიზაციის შემდეგ გამოჩნდება.
          </p>
        )}
      </div>

      <button
        onClick={() => onDiscussInChat(allContext)}
        aria-label="რეკომენდაციების AI ჩატში განხილვა"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#4f46e5] py-4 font-bold text-white shadow-md transition-all hover:bg-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span>&#129302;</span>
        AI ჩატში განხილვა
      </button>
    </section>
  );
}
