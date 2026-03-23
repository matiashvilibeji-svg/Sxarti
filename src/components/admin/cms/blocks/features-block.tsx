"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

interface FeaturesBlockData {
  items: FeatureItem[];
  columns: 2 | 3;
}

interface FeaturesBlockProps {
  data: FeaturesBlockData;
  onChange: (data: FeaturesBlockData) => void;
}

export const featuresBlockDefaults: FeaturesBlockData = {
  items: [{ icon: "", title: "", description: "" }],
  columns: 3,
};

export function FeaturesBlock({ data, onChange }: FeaturesBlockProps) {
  const addItem = () => {
    onChange({
      ...data,
      items: [...data.items, { icon: "", title: "", description: "" }],
    });
  };

  const removeItem = (index: number) => {
    onChange({
      ...data,
      items: data.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (
    index: number,
    field: keyof FeatureItem,
    value: string,
  ) => {
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ ...data, items: newItems });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          Columns
        </Label>
        <Select
          value={String(data.columns)}
          onValueChange={(v) =>
            onChange({ ...data, columns: Number(v) as 2 | 3 })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 Columns</SelectItem>
            <SelectItem value="3">3 Columns</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {data.items.map((item, index) => (
          <div
            key={index}
            className="rounded-xl bg-surface-container-low p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface-variant">
                Feature {index + 1}
              </span>
              {data.items.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                  Icon name
                </Label>
                <Input
                  value={item.icon}
                  onChange={(e) => updateItem(index, "icon", e.target.value)}
                  placeholder="bolt"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                  Title
                </Label>
                <Input
                  value={item.title}
                  onChange={(e) => updateItem(index, "title", e.target.value)}
                  placeholder="Feature title"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                Description
              </Label>
              <Textarea
                value={item.description}
                onChange={(e) =>
                  updateItem(index, "description", e.target.value)
                }
                placeholder="Feature description..."
                rows={2}
              />
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addItem} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Feature
      </Button>
    </div>
  );
}
