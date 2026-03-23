"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CtaBlockData {
  headline: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  variant: "primary" | "secondary" | "gradient";
}

interface CtaBlockProps {
  data: CtaBlockData;
  onChange: (data: CtaBlockData) => void;
}

export const ctaBlockDefaults: CtaBlockData = {
  headline: "",
  description: "",
  buttonText: "",
  buttonUrl: "",
  variant: "primary",
};

export function CtaBlock({ data, onChange }: CtaBlockProps) {
  const update = (field: keyof CtaBlockData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          Headline
        </Label>
        <Input
          value={data.headline}
          onChange={(e) => update("headline", e.target.value)}
          placeholder="Ready to get started?"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          Description
        </Label>
        <Textarea
          value={data.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Join thousands of businesses..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            Button Text
          </Label>
          <Input
            value={data.buttonText}
            onChange={(e) => update("buttonText", e.target.value)}
            placeholder="დაიწყე უფასოდ"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            Button URL
          </Label>
          <Input
            value={data.buttonUrl}
            onChange={(e) => update("buttonUrl", e.target.value)}
            placeholder="/onboarding/start"
            className="text-xs font-mono"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          Style Variant
        </Label>
        <Select
          value={data.variant}
          onValueChange={(v) =>
            onChange({ ...data, variant: v as CtaBlockData["variant"] })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="primary">Primary</SelectItem>
            <SelectItem value="secondary">Secondary</SelectItem>
            <SelectItem value="gradient">Gradient</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
