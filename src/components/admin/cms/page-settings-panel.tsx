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
import type { CmsPage } from "@/types/admin";

interface PageSettingsPanelProps {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  status: CmsPage["status"];
  lastSaved: string | null;
  onTitleChange: (title: string) => void;
  onSlugChange: (slug: string) => void;
  onMetaTitleChange: (metaTitle: string) => void;
  onMetaDescriptionChange: (metaDescription: string) => void;
  onStatusChange: (status: CmsPage["status"]) => void;
  onPublish: () => void;
  onUnpublish: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}

export function PageSettingsPanel({
  title,
  slug,
  metaTitle,
  metaDescription,
  status,
  lastSaved,
  onTitleChange,
  onSlugChange,
  onMetaTitleChange,
  onMetaDescriptionChange,
  onStatusChange,
  onPublish,
  onUnpublish,
}: PageSettingsPanelProps) {
  const handleTitleChange = (newTitle: string) => {
    onTitleChange(newTitle);
    if (!slug || slug === slugify(title)) {
      onSlugChange(slugify(newTitle));
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          Page Title
        </Label>
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Page title"
          className="text-lg font-semibold"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          Slug
        </Label>
        <Input
          value={slug}
          onChange={(e) => onSlugChange(slugify(e.target.value))}
          placeholder="page-slug"
          className="text-xs font-mono"
        />
      </div>

      <div className="h-px bg-surface-container-high" />

      <div className="space-y-2">
        <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          Meta Title (SEO)
        </Label>
        <Input
          value={metaTitle}
          onChange={(e) => onMetaTitleChange(e.target.value)}
          placeholder="SEO title..."
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          Meta Description (SEO)
        </Label>
        <Textarea
          value={metaDescription}
          onChange={(e) => onMetaDescriptionChange(e.target.value)}
          placeholder="SEO description..."
          rows={3}
        />
      </div>

      <div className="h-px bg-surface-container-high" />

      <div className="space-y-2">
        <Label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          Status
        </Label>
        <Select
          value={status}
          onValueChange={(v) => onStatusChange(v as CmsPage["status"])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        {status !== "published" ? (
          <Button onClick={onPublish} className="flex-1">
            Publish
          </Button>
        ) : (
          <Button variant="outline" onClick={onUnpublish} className="flex-1">
            Unpublish
          </Button>
        )}
      </div>

      {lastSaved && (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-[10px] font-medium text-on-surface-variant uppercase tracking-widest">
            Last saved: {new Date(lastSaved).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
