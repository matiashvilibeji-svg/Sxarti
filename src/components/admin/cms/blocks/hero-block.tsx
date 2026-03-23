"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface HeroBlockData {
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaUrl: string;
  backgroundImage: string;
}

interface HeroBlockProps {
  data: HeroBlockData;
  onChange: (data: HeroBlockData) => void;
}

export const heroBlockDefaults: HeroBlockData = {
  headline: "",
  subheadline: "",
  ctaText: "",
  ctaUrl: "",
  backgroundImage: "",
};

export function HeroBlock({ data, onChange }: HeroBlockProps) {
  const update = (field: keyof HeroBlockData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          Headline
        </Label>
        <Input
          value={data.headline}
          onChange={(e) => update("headline", e.target.value)}
          placeholder="მართეთ თქვენი ბიზნესი სხარტად"
          className="text-lg font-medium"
        />
        <p className="text-[11px] text-on-surface-variant/60 italic">
          Recommended length: 30-50 characters for optimal display.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          Sub-headline / Description
        </Label>
        <textarea
          value={data.subheadline}
          onChange={(e) => update("subheadline", e.target.value)}
          placeholder="ინტუიციური პლატფორმა მცირე და საშუალო ბიზნესის ავტომატიზაციისთვის..."
          rows={4}
          className="flex w-full rounded-lg bg-surface-container-lowest px-3 py-2 text-sm text-foreground ghost-border transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:bg-surface-container-low focus-visible:input-focus-glow leading-relaxed"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              Hero Image URL
            </Label>
            <Input
              value={data.backgroundImage}
              onChange={(e) => update("backgroundImage", e.target.value)}
              placeholder="https://images.sxarti.ge/hero.png"
              className="text-xs font-mono"
            />
          </div>
          {data.backgroundImage && (
            <div className="aspect-video w-full rounded-lg bg-surface-container-low overflow-hidden">
              <img
                src={data.backgroundImage}
                alt="Hero preview"
                className="w-full h-full object-cover opacity-60"
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              Primary CTA Label
            </Label>
            <Input
              value={data.ctaText}
              onChange={(e) => update("ctaText", e.target.value)}
              placeholder="დაიწყე უფასოდ"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
              CTA Link
            </Label>
            <Input
              value={data.ctaUrl}
              onChange={(e) => update("ctaUrl", e.target.value)}
              placeholder="/onboarding/start"
              className="text-xs font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
