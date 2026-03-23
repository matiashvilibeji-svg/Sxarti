"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutGrid, List, Package, Plus, Search } from "lucide-react";
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
import { ProductFormModal, ProductGrid } from "@/components/products";
import { useSupabase } from "@/hooks/use-supabase";
import { useTenant } from "@/hooks/use-tenant";
import type { Product } from "@/types/database";

export default function ProductsPage() {
  const supabase = useSupabase();
  const { tenant, loading: tenantLoading } = useTenant();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!tenant) return;
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setProducts(
      ((data as Product[]) ?? []).map((p) => ({
        ...p,
        images: p.images ?? [],
        stock_quantity: p.stock_quantity ?? 0,
        low_stock_threshold: p.low_stock_threshold ?? 5,
        price: p.price ?? 0,
      })),
    );
    setLoading(false);
  }, [supabase, tenant]);

  useEffect(() => {
    if (tenant) fetchProducts();
  }, [tenant, fetchProducts]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", deleteTarget.id);
    setDeleteTarget(null);
    fetchProducts();
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingProduct(null);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (tenantLoading) return <Loading />;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-display text-on-surface">
          პროდუქტები
        </h1>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          პროდუქტის დამატება
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="პროდუქტის ძიება..."
            className="pl-9"
          />
        </div>
        <div className="flex rounded-lg ghost-border">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-10 w-10 rounded-r-none"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-10 w-10 rounded-l-none"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="პროდუქტები ჯერ არ არის"
          description="დაამატეთ თქვენი პირველი პროდუქტი კატალოგში"
          actionLabel="პროდუქტის დამატება"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <ProductGrid
          products={filteredProducts}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          viewMode={viewMode}
        />
      )}

      {tenant && (
        <ProductFormModal
          open={formOpen}
          onOpenChange={handleFormClose}
          product={editingProduct}
          tenantId={tenant.id}
          onSaved={fetchProducts}
        />
      )}

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>პროდუქტის წაშლა</DialogTitle>
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
