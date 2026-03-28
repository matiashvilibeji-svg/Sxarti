"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSupabase } from "@/hooks/use-supabase";
import type { Product, Bundle, BundleItem } from "@/types/database";

interface BundleFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bundle?: Bundle | null;
  bundleItems?: (BundleItem & { product: Product })[];
  tenantId: string;
  onSaved: () => void;
}

interface ItemRow {
  product_id: string;
  quantity: number;
}

export function BundleFormModal({
  open,
  onOpenChange,
  bundle,
  bundleItems,
  tenantId,
  onSaved,
}: BundleFormModalProps) {
  const supabase = useSupabase();
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">(
    "percentage",
  );
  const [discountValue, setDiscountValue] = useState("");
  const [botAutoSuggest, setBotAutoSuggest] = useState(false);
  const [items, setItems] = useState<ItemRow[]>([]);

  const isEditing = !!bundle;

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("name");
    setProducts((data as Product[]) ?? []);
  }, [supabase, tenantId]);

  useEffect(() => {
    if (open) {
      fetchProducts();
      if (bundle) {
        setName(bundle.name);
        setDescription(bundle.description ?? "");
        setDiscountType(bundle.discount_type);
        setDiscountValue(String(bundle.discount_value));
        setBotAutoSuggest(bundle.bot_auto_suggest);
        setItems(
          bundleItems?.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
          })) ?? [],
        );
      } else {
        setName("");
        setDescription("");
        setDiscountType("percentage");
        setDiscountValue("");
        setBotAutoSuggest(false);
        setItems([]);
      }
    }
  }, [open, bundle, bundleItems, fetchProducts]);

  const addItem = () => {
    setItems([...items, { product_id: "", quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof ItemRow,
    value: string | number,
  ) => {
    setItems(
      items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const originalPrice = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.product_id);
    return sum + (product?.price ?? 0) * item.quantity;
  }, 0);

  const bundlePrice =
    discountType === "fixed"
      ? Math.max(0, originalPrice - (Number(discountValue) || 0))
      : originalPrice * (1 - (Number(discountValue) || 0) / 100);

  const savings = originalPrice - bundlePrice;

  const validItems = items.filter((i) => i.product_id && i.quantity > 0);
  const canSave = name.trim() && validItems.length >= 2;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);

    const bundleData = {
      tenant_id: tenantId,
      name: name.trim(),
      description: description.trim() || null,
      discount_type: discountType,
      discount_value: Number(discountValue) || 0,
      bot_auto_suggest: botAutoSuggest,
    };

    let bundleId: string;

    if (isEditing) {
      await supabase.from("bundles").update(bundleData).eq("id", bundle.id);
      bundleId = bundle.id;
      // Delete old items and re-insert
      await supabase.from("bundle_items").delete().eq("bundle_id", bundleId);
    } else {
      const { data } = await supabase
        .from("bundles")
        .insert(bundleData)
        .select("id")
        .single();
      bundleId = data!.id;
    }

    // Insert bundle items
    const itemRows = validItems.map((item) => ({
      bundle_id: bundleId,
      product_id: item.product_id,
      quantity: item.quantity,
    }));

    if (itemRows.length > 0) {
      await supabase.from("bundle_items").insert(itemRows);
    }

    setSaving(false);
    onOpenChange(false);
    onSaved();
  };

  const usedProductIds = items.map((i) => i.product_id).filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-full overflow-y-auto sm:max-h-[90vh] sm:max-w-2xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "ბანდლის რედაქტირება" : "ბანდლის შექმნა"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="bundle-name">სახელი</Label>
            <Input
              id="bundle-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="მაგ: საშობაო კომპლექტი"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="bundle-desc">აღწერა</Label>
            <Textarea
              id="bundle-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ბანდლის აღწერა (არასავალდებულო)"
              rows={2}
            />
          </div>

          {/* Products in bundle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>პროდუქტები ბანდლში</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
              >
                <Plus className="mr-1 h-4 w-4" />
                დამატება
              </Button>
            </div>

            {items.length === 0 && (
              <p className="text-sm text-on-surface-variant">
                დაამატეთ მინიმუმ 2 პროდუქტი ბანდლში
              </p>
            )}

            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-lg bg-surface-container-low p-3"
              >
                <Select
                  value={item.product_id}
                  onValueChange={(val) => updateItem(idx, "product_id", val)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="აირჩიეთ პროდუქტი" />
                  </SelectTrigger>
                  <SelectContent>
                    {products
                      .filter(
                        (p) =>
                          p.id === item.product_id ||
                          !usedProductIds.includes(p.id),
                      )
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} — {p.price.toFixed(2)} ₾
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(
                      idx,
                      "quantity",
                      Math.max(1, Number(e.target.value)),
                    )
                  }
                  className="w-20"
                  placeholder="რაოდ."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive"
                  onClick={() => removeItem(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ფასდაკლების ტიპი</Label>
              <Select
                value={discountType}
                onValueChange={(val) =>
                  setDiscountType(val as "fixed" | "percentage")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">პროცენტი (%)</SelectItem>
                  <SelectItem value="fixed">ფიქსირებული (₾)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount-value">
                ფასდაკლება {discountType === "percentage" ? "(%)" : "(₾)"}
              </Label>
              <Input
                id="discount-value"
                type="number"
                min="0"
                step={discountType === "percentage" ? "1" : "0.01"}
                max={discountType === "percentage" ? "100" : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Price preview */}
          {validItems.length >= 2 && (
            <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">ორიგინალი ფასი:</span>
                <span>{originalPrice.toFixed(2)} ₾</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">ფასდაკლება:</span>
                <span className="text-green-600">-{savings.toFixed(2)} ₾</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-outline-variant pt-1 font-semibold">
                <span>ბანდლის ფასი:</span>
                <span className="text-primary">{bundlePrice.toFixed(2)} ₾</span>
              </div>
            </div>
          )}

          {/* Bot auto suggest toggle */}
          <div className="flex items-center justify-between rounded-lg border border-outline-variant p-4">
            <div className="space-y-0.5">
              <Label htmlFor="auto-suggest" className="text-sm font-medium">
                ბოტის ავტომატური შეთავაზება
              </Label>
              <p className="text-xs text-on-surface-variant">
                ჩართვისას ბოტი ავტომატურად შესთავაზებს ამ ბანდლს, თუ
                მომხმარებელი რომელიმე პროდუქტით დაინტერესდება
              </p>
            </div>
            <Switch
              id="auto-suggest"
              checked={botAutoSuggest}
              onCheckedChange={setBotAutoSuggest}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            გაუქმება
          </Button>
          <Button onClick={handleSave} disabled={saving || !canSave}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            შენახვა
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
