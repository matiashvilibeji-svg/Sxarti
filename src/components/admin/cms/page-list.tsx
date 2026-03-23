"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Copy, Archive, Trash2, Search, Plus } from "lucide-react";
import type { CmsPage } from "@/types/admin";

interface PageListProps {
  pages: CmsPage[];
}

const STATUS_BADGE: Record<
  CmsPage["status"],
  { variant: "default" | "outline" | "destructive"; label: string }
> = {
  draft: { variant: "outline", label: "Draft" },
  published: { variant: "default", label: "Published" },
  archived: { variant: "destructive", label: "Archived" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function PageList({ pages: initialPages }: PageListProps) {
  const router = useRouter();
  const [pages, setPages] = useState(initialPages);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<CmsPage | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = pages.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDuplicate = async (page: CmsPage) => {
    setActionLoading(page.id);
    try {
      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${page.title} (Copy)`,
          slug: `${page.slug}-copy-${Date.now()}`,
          content: page.content,
          meta_title: page.meta_title,
          meta_description: page.meta_description,
          status: "draft",
        }),
      });
      if (res.ok) {
        const newPage = await res.json();
        setPages((prev) => [newPage, ...prev]);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (page: CmsPage) => {
    setActionLoading(page.id);
    try {
      const res = await fetch(`/api/admin/cms/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      if (res.ok) {
        setPages((prev) =>
          prev.map((p) =>
            p.id === page.id ? { ...p, status: "archived" as const } : p,
          ),
        );
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.id);
    try {
      const res = await fetch(`/api/admin/cms/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPages((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      }
    } finally {
      setActionLoading(null);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Website CMS
          </h1>
          <p className="text-sm text-on-surface-variant">
            Manage your marketing website pages
          </p>
        </div>
        <Button onClick={() => router.push("/admin/cms/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          New Page
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages..."
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pages Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-on-surface-variant">
            {pages.length === 0
              ? 'No pages yet. Click "New Page" to create your first page.'
              : "No pages match your filters."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-surface-container-high overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-container-high bg-surface-container-low">
                <th className="text-left px-6 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">
                  Title
                </th>
                <th className="text-left px-6 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider hidden md:table-cell">
                  Slug
                </th>
                <th className="text-left px-6 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider hidden lg:table-cell">
                  Updated
                </th>
                <th className="text-right px-6 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high">
              {filtered.map((page) => {
                const badge = STATUS_BADGE[page.status];
                return (
                  <tr
                    key={page.id}
                    className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors"
                  >
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/cms/${page.slug}`)}
                        className="font-semibold text-on-surface hover:text-primary transition-colors text-left"
                      >
                        {page.title}
                      </button>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-xs font-mono text-on-surface-variant">
                        /{page.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-xs text-on-surface-variant">
                        {timeAgo(page.updated_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/admin/cms/${page.slug}`)}
                          className="h-8 w-8"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(page)}
                          disabled={actionLoading === page.id}
                          className="h-8 w-8"
                          title="Duplicate"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleArchive(page)}
                          disabled={
                            actionLoading === page.id ||
                            page.status === "archived"
                          }
                          className="h-8 w-8"
                          title="Archive"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(page)}
                          disabled={actionLoading === page.id}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Page</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading === deleteTarget?.id}
            >
              {actionLoading === deleteTarget?.id ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
