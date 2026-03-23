"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImageBlockData {
  url: string;
  alt: string;
  caption: string;
  width: "full" | "medium" | "small";
}

interface ImageBlockProps {
  data: ImageBlockData;
  onChange: (data: ImageBlockData) => void;
}

export const imageBlockDefaults: ImageBlockData = {
  url: "",
  alt: "",
  caption: "",
  width: "full",
};

export function ImageBlock({ data, onChange }: ImageBlockProps) {
  const update = (field: keyof ImageBlockData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          Image URL
        </Label>
        <Input
          value={data.url}
          onChange={(e) => update("url", e.target.value)}
          placeholder="https://images.sxarti.ge/photo.jpg"
          className="text-xs font-mono"
        />
      </div>

      {data.url && (
        <div className="aspect-video w-full max-w-md rounded-lg bg-surface-container-low overflow-hidden">
          <img
            src={data.url}
            alt={data.alt || "Preview"}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            Alt Text
          </Label>
          <Input
            value={data.alt}
            onChange={(e) => update("alt", e.target.value)}
            placeholder="Describe the image..."
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            Caption (optional)
          </Label>
          <Input
            value={data.caption}
            onChange={(e) => update("caption", e.target.value)}
            placeholder="Image caption..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          Width
        </Label>
        <Select
          value={data.width}
          onValueChange={(v) =>
            onChange({ ...data, width: v as ImageBlockData["width"] })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Full Width</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="small">Small</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
