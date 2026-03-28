"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Layout,
  Type,
  Image as ImageIcon,
  MousePointerClick,
  Grid3X3,
  MessageSquareQuote,
  CreditCard,
  HelpCircle,
  Plus,
} from "lucide-react";
import type { CmsBlock } from "@/types/admin";

const BLOCK_TYPES: {
  type: CmsBlock["type"];
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    type: "hero",
    label: "Hero",
    icon: <Layout className="h-5 w-5" />,
    description: "Headline, CTA & image",
  },
  {
    type: "text",
    label: "Text",
    icon: <Type className="h-5 w-5" />,
    description: "Rich text content",
  },
  {
    type: "image",
    label: "Image",
    icon: <ImageIcon className="h-5 w-5" />,
    description: "Photo with caption",
  },
  {
    type: "cta",
    label: "Call to Action",
    icon: <MousePointerClick className="h-5 w-5" />,
    description: "Action button section",
  },
  {
    type: "features",
    label: "Features",
    icon: <Grid3X3 className="h-5 w-5" />,
    description: "Feature grid layout",
  },
  {
    type: "testimonials",
    label: "Testimonials",
    icon: <MessageSquareQuote className="h-5 w-5" />,
    description: "Customer reviews",
  },
  {
    type: "pricing",
    label: "Pricing",
    icon: <CreditCard className="h-5 w-5" />,
    description: "Plan comparison table",
  },
  {
    type: "faq",
    label: "FAQ",
    icon: <HelpCircle className="h-5 w-5" />,
    description: "Questions & answers",
  },
];

interface BlockTypeSelectorProps {
  onSelect: (type: CmsBlock["type"]) => void;
}

export function BlockTypeSelector({ onSelect }: BlockTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={ref} className="relative flex justify-center">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 text-xs"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Block
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 z-50 w-80 bg-surface-container-lowest rounded-xl shadow-ambient-lg border border-surface-container-high p-2 grid grid-cols-2 gap-1">
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.type}
              type="button"
              onClick={() => {
                onSelect(bt.type);
                setIsOpen(false);
              }}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container-low transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-surface-container-low flex items-center justify-center text-on-surface-variant group-hover:text-primary group-hover:bg-primary/10 transition-colors shrink-0">
                {bt.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-on-surface truncate">
                  {bt.label}
                </p>
                <p className="text-[10px] text-on-surface-variant truncate">
                  {bt.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
