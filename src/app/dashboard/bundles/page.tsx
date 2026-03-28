"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, Plus, Search, Pencil, Trash2, Bot, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Loading } from "@/components/shared/loading";
import { BundleFormModal } from "@/components/bundles";
import { useSupabase } from "@/hooks/use-supabase";
import { useTenant } from "@/hooks/use-tenant";
import type { Bundle, BundleItem, Product } from "@/types/database";

interface BundleRow extends Bundle {
  items: (BundleItem & { product: Product })[];
}

export default function BundlesPage() {
  const supabase = useSupabase();
  const { tenant, loading: tenantLoading } = useTenant();

  const [bundles, setBundles] = useState<BundleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<BundleRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BundleRow | null>(null);

  const fetchBundles = useCallback(async () => {
    if (!tenant) return;
    setLoading(true);

    // Fetch bundles
    const { data: bundlesData } = await supabase
      .from("bundles")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    const rawBundles = (bundlesData as Bundle[]) ?? [];
    if (rawBundles.length === 0) {
      setBundles([]);
      setLoading(false);
      return;
    }

    // Fetch items for all bundles
    const bundleIds = rawBundles.map((b) => b.id);
    const { data: itemsData } = await supabase
      .from("bundle_items")
      .select("*")
      .in("bundle_id", bundleIds);

    const items = (itemsData as BundleItem[]) ?? [];

    // Fetch all products referenced
    const productIds = Array.from(new Set(items.map((i) => i.product_id)));
    const { data: productsData } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds.length > 0 ? productIds : ["_none_"]);

    const productMap = new Map(
      ((productsData as Product[]) ?? []).map((p) => [p.id, p]),
    );

    setBundles(
      rawBundles.map((b) => ({
        ...b,
        items: items
          .filter((i) => i.bundle_id === b.id)
          .map((i) => ({ ...i, product: productMap.get(i.product_id)! }))
          .filter((i) => i.product),
      })),
    );
    setLoading(false);
  }, [supabase, tenant]);

  useEffect(() => {
    if (tenant) fetchBundles();
  }, [tenant, fetchBundles]);

  const handleEdit = (bundle: BundleRow) => {
    setEditingBundle(bundle);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase
      .from("bundles")
      .update({ is_active: false })
      .eq("id", deleteTarget.id);
    setDeleteTarget(null);
    fetchBundles();
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingBundle(null);
  };

  const filteredBundles = bundles.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const calculatePrice = (bundle: BundleRow) => {
    const original = bundle.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
    const discounted =
      bundle.discount_type === "fixed"
        ? Math.max(0, original - bundle.discount_value)
        : original * (1 - bundle.discount_value / 100);
    return { original, discounted };
  };

  if (tenantLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-display text-on-surface">
          ბანდლები
        </h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          ბანდლის შექმნა
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ბანდლის ძიება..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <Loading />
      ) : filteredBundles.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="ბანდლები ჯერ არ არის"
          description="შექმენით პირველი ბანდლი თქვენი პროდუქტებისგან"
          actionLabel="ბანდლის შექმნა"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBundles.map((bundle) => {
            const { original, discounted } = calculatePrice(bundle);
            return (
              <div
                key={bundle.id}
                className="rounded-xl border border-outline-variant bg-surface-container-low p-5 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-on-surface">
                      {bundle.name}
                    </h3>
                    {bundle.description && (
                      <p className="mt-0.5 text-sm text-on-surface-variant line-clamp-2">
                        {bundle.description}
                      </p>
                    )}
                  </div>
                  {bundle.bot_auto_suggest && (
                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      <Bot className="h-3 w-3" />
                      ავტო
                    </span>
                  )}
                </div>

                {/* Items list */}
                <div className="mb-3 space-y-1">
                  {bundle.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 text-sm text-on-surface-variant"
                    >
                      <Package className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{item.product.name}</span>
                      <span className="ml-auto text-xs">x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="mb-4 rounded-lg bg-surface-container p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant line-through">
                      {original.toFixed(2)} ₾
                    </span>
                    <span className="font-semibold text-primary">
                      {discounted.toFixed(2)} ₾
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-green-600">
                    -{" "}
                    {bundle.discount_type === "percentage"
                      ? `${bundle.discount_value}%`
                      : `${bundle.discount_value} ₾`}{" "}
                    ფასდაკლება
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(bundle)}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    რედაქტირება
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(bundle)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tenant && (
        <BundleFormModal
          open={formOpen}
          onOpenChange={handleFormClose}
          bundle={editingBundle}
          bundleItems={editingBundle?.items}
          tenantId={tenant.id}
          onSaved={fetchBundles}
        />
      )}

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ბანდლის წაშლა</DialogTitle>
            <DialogDescription>
              ნამდვილად გსურთ &quot;{deleteTarget?.name}&quot; წაშლა?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              გაუქმება
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              წაშლა
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
