"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { CmsBlock, CmsPage } from "@/types/admin";
import { BlockTypeSelector } from "./block-type-selector";
import { PageSettingsPanel } from "./page-settings-panel";
import { HeroBlock, heroBlockDefaults } from "./blocks/hero-block";
import { TextBlock, textBlockDefaults } from "./blocks/text-block";
import { ImageBlock, imageBlockDefaults } from "./blocks/image-block";
import { CtaBlock, ctaBlockDefaults } from "./blocks/cta-block";
import { FeaturesBlock, featuresBlockDefaults } from "./blocks/features-block";
import { PricingBlock, pricingBlockDefaults } from "./blocks/pricing-block";

const BLOCK_DEFAULTS: Record<CmsBlock["type"], Record<string, unknown>> = {
  hero: { ...heroBlockDefaults },
  text: { ...textBlockDefaults },
  image: { ...imageBlockDefaults },
  cta: { ...ctaBlockDefaults },
  features: { ...featuresBlockDefaults },
  pricing: { ...pricingBlockDefaults },
  testimonials: { items: [] },
  faq: { items: [] },
};

const BLOCK_LABELS: Record<CmsBlock["type"], string> = {
  hero: "Hero Section",
  text: "Text Block",
  image: "Image Block",
  cta: "Call to Action",
  features: "Features Grid",
  testimonials: "Testimonials",
  pricing: "Pricing Table",
  faq: "FAQ Accordion",
};

interface BlockEditorProps {
  page: CmsPage | null;
  isNew: boolean;
}

export function BlockEditor({ page, isNew }: BlockEditorProps) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<CmsBlock[]>(page?.content ?? []);
  const [title, setTitle] = useState(page?.title ?? "");
  const [slug, setSlug] = useState(page?.slug ?? "");
  const [metaTitle, setMetaTitle] = useState(page?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(
    page?.meta_description ?? "",
  );
  const [status, setStatus] = useState<CmsPage["status"]>(
    page?.status ?? "draft",
  );
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(
    page?.updated_at ?? null,
  );
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(
    blocks.length > 0 ? 0 : null,
  );
  const [isDirty, setDirty] = useState(false);

  const markDirty = useCallback(() => setDirty(true), []);

  const addBlock = (type: CmsBlock["type"], afterIndex?: number) => {
    const newBlock: CmsBlock = {
      id: crypto.randomUUID(),
      type,
      data: { ...BLOCK_DEFAULTS[type] },
      order: 0,
    };
    const newBlocks = [...blocks];
    const insertAt =
      afterIndex !== undefined ? afterIndex + 1 : newBlocks.length;
    newBlocks.splice(insertAt, 0, newBlock);
    newBlocks.forEach((b, i) => (b.order = i));
    setBlocks(newBlocks);
    setActiveBlockIndex(insertAt);
    markDirty();
  };

  const removeBlock = (index: number) => {
    const newBlocks = blocks.filter((_, i) => i !== index);
    newBlocks.forEach((b, i) => (b.order = i));
    setBlocks(newBlocks);
    if (activeBlockIndex === index) {
      setActiveBlockIndex(
        newBlocks.length > 0 ? Math.min(index, newBlocks.length - 1) : null,
      );
    }
    markDirty();
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [
      newBlocks[newIndex],
      newBlocks[index],
    ];
    newBlocks.forEach((b, i) => (b.order = i));
    setBlocks(newBlocks);
    setActiveBlockIndex(newIndex);
    markDirty();
  };

  const updateBlockData = (index: number, data: Record<string, unknown>) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], data };
    setBlocks(newBlocks);
    markDirty();
  };

  const save = async (newStatus?: CmsPage["status"]) => {
    if (!title.trim() || !slug.trim()) return;
    setSaving(true);

    const payload = {
      title,
      slug,
      content: blocks,
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      status: newStatus ?? status,
      published_at:
        (newStatus ?? status) === "published"
          ? new Date().toISOString()
          : (page?.published_at ?? null),
    };

    try {
      const url = isNew ? "/api/admin/cms" : `/api/admin/cms/${page!.id}`;
      const method = isNew ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");

      const saved = await res.json();
      setLastSaved(new Date().toISOString());
      setDirty(false);

      if (newStatus) setStatus(newStatus);

      if (isNew && saved.slug) {
        router.replace(`/admin/cms/${saved.slug}`);
      }
    } catch {
      // Error is visible from the UI's saving state
    } finally {
      setSaving(false);
    }
  };

  const renderBlockContent = (block: CmsBlock, index: number) => {
    const props = {
      data: block.data as never,
      onChange: ((data: Record<string, unknown>) =>
        updateBlockData(index, data)) as never,
    };

    switch (block.type) {
      case "hero":
        return <HeroBlock {...props} />;
      case "text":
        return <TextBlock {...props} />;
      case "image":
        return <ImageBlock {...props} />;
      case "cta":
        return <CtaBlock {...props} />;
      case "features":
        return <FeaturesBlock {...props} />;
      case "pricing":
        return <PricingBlock {...props} />;
      case "testimonials":
        return (
          <p className="text-sm text-on-surface-variant italic">
            Testimonials block editor — coming soon
          </p>
        );
      case "faq":
        return (
          <p className="text-sm text-on-surface-variant italic">
            FAQ block editor — coming soon
          </p>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left: Section Navigation (Desktop Stitch design panel 1) */}
      <div className="w-full lg:w-64 shrink-0 space-y-3">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            Page Sections
          </span>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
            {blocks.length} Total
          </span>
        </div>

        <div className="space-y-1">
          {blocks.map((block, index) => (
            <button
              key={block.id}
              type="button"
              onClick={() => setActiveBlockIndex(index)}
              className={`w-full flex items-center justify-between p-3 rounded-xl shadow-ambient-sm border transition-all group ${
                activeBlockIndex === index
                  ? "border-primary/40 ring-1 ring-primary/10 bg-surface-container-lowest relative overflow-hidden"
                  : "border-surface-container-high bg-surface-container-lowest hover:border-primary/30"
              }`}
            >
              {activeBlockIndex === index && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              )}
              <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-on-surface-variant/40" />
                <span
                  className={`text-sm ${
                    activeBlockIndex === index
                      ? "font-bold text-on-surface"
                      : "font-semibold text-on-surface-variant"
                  }`}
                >
                  {BLOCK_LABELS[block.type]}
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveBlock(index, "up");
                  }}
                  disabled={index === 0}
                  className="p-0.5 rounded hover:bg-surface-container-high disabled:opacity-30"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveBlock(index, "down");
                  }}
                  disabled={index === blocks.length - 1}
                  className="p-0.5 rounded hover:bg-surface-container-high disabled:opacity-30"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBlock(index);
                  }}
                  className="p-0.5 rounded hover:bg-destructive/10 text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </button>
          ))}
        </div>

        <BlockTypeSelector onSelect={(type) => addBlock(type)} />

        {/* Page Settings below section list */}
        <div className="mt-8 pt-6 border-t border-surface-container-high">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4 block">
            Page Settings
          </span>
          <PageSettingsPanel
            title={title}
            slug={slug}
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            status={status}
            lastSaved={lastSaved}
            onTitleChange={(v) => {
              setTitle(v);
              markDirty();
            }}
            onSlugChange={(v) => {
              setSlug(v);
              markDirty();
            }}
            onMetaTitleChange={(v) => {
              setMetaTitle(v);
              markDirty();
            }}
            onMetaDescriptionChange={(v) => {
              setMetaDescription(v);
              markDirty();
            }}
            onStatusChange={(v) => {
              setStatus(v);
              markDirty();
            }}
            onPublish={() => save("published")}
            onUnpublish={() => save("draft")}
          />
        </div>
      </div>

      {/* Right: Editor Area (Desktop Stitch design panel 2) */}
      <div className="flex-1 min-w-0 space-y-6">
        {activeBlockIndex !== null && blocks[activeBlockIndex] ? (
          <>
            <div className="flex items-center justify-between bg-surface-container-lowest p-6 rounded-2xl shadow-ambient-sm">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  {BLOCK_LABELS[blocks[activeBlockIndex].type]}
                </h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  Edit the content for this section
                </p>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient-sm">
              {renderBlockContent(blocks[activeBlockIndex], activeBlockIndex)}
            </div>

            <div className="flex justify-center">
              <BlockTypeSelector
                onSelect={(type) => addBlock(type, activeBlockIndex)}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-on-surface-variant mb-4">
              {blocks.length === 0
                ? "No blocks yet. Add your first section to get started."
                : "Select a section from the left to edit it."}
            </p>
            {blocks.length === 0 && (
              <BlockTypeSelector onSelect={(type) => addBlock(type)} />
            )}
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest/90 backdrop-blur-lg border-t border-surface-container-high px-6 py-4 z-50 lg:pl-72">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:block">
            {isDirty && (
              <span className="text-xs text-on-surface-variant italic">
                Unsaved changes
              </span>
            )}
            {!isDirty && lastSaved && (
              <span className="text-xs text-on-surface-variant italic">
                Last saved: {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="ghost"
              onClick={() => save()}
              disabled={saving || !title.trim() || !slug.trim()}
              className="flex-1 sm:flex-none"
            >
              {saving ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              onClick={() => save("published")}
              disabled={saving || !title.trim() || !slug.trim()}
              className="flex-1 sm:flex-none"
            >
              {saving ? "Publishing..." : "Publish Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
