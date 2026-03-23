"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TextBlockData {
  content: string;
  alignment: "left" | "center" | "right";
}

interface TextBlockProps {
  data: TextBlockData;
  onChange: (data: TextBlockData) => void;
}

export const textBlockDefaults: TextBlockData = {
  content: "",
  alignment: "left",
};

export function TextBlock({ data, onChange }: TextBlockProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          Content
        </Label>
        <Textarea
          value={data.content}
          onChange={(e) => onChange({ ...data, content: e.target.value })}
          placeholder="Enter text content..."
          rows={6}
          className="leading-relaxed"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          Alignment
        </Label>
        <Select
          value={data.alignment}
          onValueChange={(v) =>
            onChange({ ...data, alignment: v as TextBlockData["alignment"] })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
