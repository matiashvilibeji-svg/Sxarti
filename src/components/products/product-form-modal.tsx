"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "./image-upload";
import { useSupabase } from "@/hooks/use-supabase";
import type { Product, ProductVariant } from "@/types/database";

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  tenantId: string;
  onSaved: () => void;
}

interface VariantOption {
  value: string;
  price_modifier: number;
  stock: number;
}

interface VariantRow {
  name: string;
  options: VariantOption[];
}

const emptyOption = (): VariantOption => ({
  value: "",
  price_modifier: 0,
  stock: 0,
});

export function ProductFormModal({
  open,
  onOpenChange,
  product,
  tenantId,
  onSaved,
}: ProductFormModalProps) {
  const supabase = useSupabase();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);

  const isEditing = !!product;

  useEffect(() => {
    if (open) {
      if (product) {
        setName(product.name);
        setPrice(String(product.price));
        setDescription(product.description ?? "");
        setStockQuantity(String(product.stock_quantity));
        setLowStockThreshold(String(product.low_stock_threshold));
        setImages(product.images ?? []);
        setVariants(
          product.variants?.map((v) => ({
            name: v.name,
            options: v.options.map((o) => ({ ...o })),
          })) ?? [],
        );
      } else {
        setName("");
        setPrice("");
        setDescription("");
        setStockQuantity("");
        setLowStockThreshold("5");
        setImages([]);
        setVariants([]);
      }
    }
  }, [open, product]);

  const addVariant = () => {
    setVariants([...variants, { name: "", options: [emptyOption()] }]);
  };

  const removeVariant = (vi: number) => {
    setVariants(variants.filter((_, i) => i !== vi));
  };

  const updateVariantName = (vi: number, val: string) => {
    setVariants(variants.map((v, i) => (i === vi ? { ...v, name: val } : v)));
  };

  const addOption = (vi: number) => {
    setVariants(
      variants.map((v, i) =>
        i === vi ? { ...v, options: [...v.options, emptyOption()] } : v,
      ),
    );
  };

  const removeOption = (vi: number, oi: number) => {
    setVariants(
      variants.map((v, i) =>
        i === vi ? { ...v, options: v.options.filter((_, j) => j !== oi) } : v,
      ),
    );
  };

  const updateOption = (
    vi: number,
    oi: number,
    field: keyof VariantOption,
    val: string | number,
  ) => {
    setVariants(
      variants.map((v, i) =>
        i === vi
          ? {
              ...v,
              options: v.options.map((o, j) =>
                j === oi ? { ...o, [field]: val } : o,
              ),
            }
          : v,
      ),
    );
  };

  const handleSave = async () => {
    if (!name.trim() || !price) return;

    setSaving(true);

    const cleanVariants: ProductVariant[] = variants
      .filter((v) => v.name.trim() && v.options.some((o) => o.value.trim()))
      .map((v) => ({
        name: v.name.trim(),
        options: v.options
          .filter((o) => o.value.trim())
          .map((o) => ({
            value: o.value.trim(),
            price_modifier: Number(o.price_modifier) || 0,
            stock: Number(o.stock) || 0,
          })),
      }));

    const data = {
      tenant_id: tenantId,
      name: name.trim(),
      price: Number(price),
      description: description.trim() || null,
      stock_quantity: Number(stockQuantity) || 0,
      low_stock_threshold: Number(lowStockThreshold) || 5,
      images,
      variants: cleanVariants.length > 0 ? cleanVariants : null,
    };

    if (isEditing) {
      await supabase.from("products").update(data).eq("id", product.id);
    } else {
      await supabase.from("products").insert(data);
    }

    setSaving(false);
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "პროდუქტის რედაქტირება" : "პროდუქტის დამატება"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">სახელი</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="პროდუქტის სახელი"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">ფასი (₾)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">მარაგი</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="threshold">მინიმალური მარაგი</Label>
            <Input
              id="threshold"
              type="number"
              min="0"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              placeholder="5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">აღწერა</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="პროდუქტის აღწერა"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>სურათები</Label>
            <ImageUpload
              images={images}
              onImagesChange={setImages}
              tenantId={tenantId}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>ვარიანტები</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariant}
              >
                <Plus className="mr-1 h-4 w-4" />
                ვარიანტის დამატება
              </Button>
            </div>

            {variants.map((variant, vi) => (
              <div
                key={vi}
                className="space-y-3 rounded-lg bg-surface-container-low p-4"
              >
                <div className="flex items-center gap-2">
                  <Input
                    value={variant.name}
                    onChange={(e) => updateVariantName(vi, e.target.value)}
                    placeholder="ვარიანტის სახელი (მაგ: ზომა, ფერი)"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeVariant(vi)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {variant.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2 pl-4">
                    <Input
                      value={opt.value}
                      onChange={(e) =>
                        updateOption(vi, oi, "value", e.target.value)
                      }
                      placeholder="მნიშვნელობა"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={opt.price_modifier || ""}
                      onChange={(e) =>
                        updateOption(
                          vi,
                          oi,
                          "price_modifier",
                          Number(e.target.value),
                        )
                      }
                      placeholder="± ₾"
                      className="w-24"
                    />
                    <Input
                      type="number"
                      value={opt.stock || ""}
                      onChange={(e) =>
                        updateOption(vi, oi, "stock", Number(e.target.value))
                      }
                      placeholder="მარაგი"
                      className="w-24"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeOption(vi, oi)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-4"
                  onClick={() => addOption(vi)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  ოფციის დამატება
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            გაუქმება
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            შენახვა
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
