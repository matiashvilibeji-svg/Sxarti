"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Package,
} from "lucide-react";
import { useSupabase } from "@/hooks/use-supabase";
import { useTenant } from "@/hooks/use-tenant";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatGEL } from "@/lib/utils/currency";
import type { Product } from "@/types/database";

const STEPS = [
  { label: "ბიზნეს პროფილი", num: 1 },
  { label: "Facebook", num: 2 },
  { label: "პროდუქტები", num: 3 },
  { label: "მიწოდება", num: 4 },
  { label: "გადახდა", num: 5 },
];
const CURRENT_STEP = 3;

const productSchema = z.object({
  name: z.string().min(2, "პროდუქტის სახელი სავალდებულოა (მინ. 2 სიმბოლო)"),
  price: z
    .number({ invalid_type_error: "მიუთითეთ ფასი" })
    .positive("ფასი უნდა იყოს > 0"),
  description: z
    .string()
    .max(500, "აღწერა მაქსიმუმ 500 სიმბოლო")
    .optional()
    .or(z.literal("")),
  stock_quantity: z
    .number({ invalid_type_error: "მიუთითეთ რაოდენობა" })
    .int("მთელი რიცხვი")
    .min(0, "რაოდენობა >= 0"),
});

export default function Step3Page() {
  const router = useRouter();
  const supabase = useSupabase();
  const { tenant, loading } = useTenant();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [stockQty, setStockQty] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadProducts = useCallback(async () => {
    if (!tenant) return;
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: true });

    if (error) {
      toast({
        title: "შეცდომა",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setProducts((data as Product[]) || []);
    }
    setProductsLoading(false);
  }, [tenant, supabase, toast]);

  useEffect(() => {
    if (tenant) loadProducts();
  }, [tenant, loadProducts]);

  function resetForm() {
    setName("");
    setPrice("");
    setDescription("");
    setStockQty("");
    setImageFiles([]);
    setImagePreviews([]);
    setFormErrors({});
    setEditingId(null);
    setShowForm(false);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const totalCount = imageFiles.length + files.length;
    if (totalCount > 5) {
      toast({ title: "მაქსიმუმ 5 სურათი", variant: "destructive" });
      return;
    }
    for (const f of files) {
      if (f.size > 2 * 1024 * 1024) {
        toast({
          title: "ფაილი ძალიან დიდია",
          description: `${f.name} — მაქს. 2MB`,
          variant: "destructive",
        });
        return;
      }
    }
    setImageFiles((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  }

  function removeImage(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function startEdit(product: Product) {
    setName(product.name);
    setPrice(product.price.toString());
    setDescription(product.description || "");
    setStockQty(product.stock_quantity.toString());
    setImageFiles([]);
    setImagePreviews(product.images || []);
    setEditingId(product.id);
    setShowForm(true);
  }

  async function uploadImages(productId: string): Promise<string[]> {
    const urls: string[] = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const ext = file.name.split(".").pop();
      const path = `${tenant!.id}/${productId}/${Date.now()}_${i}.${ext}`;
      const { error } = await supabase.storage
        .from("products")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("products").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  async function handleAddOrUpdate() {
    const parsed = productSchema.safeParse({
      name,
      price: parseFloat(price),
      description: description || undefined,
      stock_quantity: parseInt(stockQty, 10),
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setFormErrors(fieldErrors);
      return;
    }
    setFormErrors({});
    setSaving(true);

    try {
      if (editingId) {
        let images = imagePreviews.filter((p) => p.startsWith("http"));
        if (imageFiles.length > 0) {
          const newUrls = await uploadImages(editingId);
          images = [...images, ...newUrls];
        }

        const { data, error } = await supabase
          .from("products")
          .update({
            name,
            price: parseFloat(price),
            description: description || null,
            stock_quantity: parseInt(stockQty, 10),
            images,
          })
          .eq("id", editingId)
          .select()
          .single();

        if (error) throw error;
        setProducts((prev) =>
          prev.map((p) => (p.id === editingId ? (data as Product) : p)),
        );
      } else {
        // Insert product first to get ID for image paths
        const { data, error } = await supabase
          .from("products")
          .insert({
            tenant_id: tenant!.id,
            name,
            price: parseFloat(price),
            description: description || null,
            stock_quantity: parseInt(stockQty, 10),
            images: [],
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;

        const product = data as Product;

        // Upload images if any
        if (imageFiles.length > 0) {
          const imageUrls = await uploadImages(product.id);
          const { error: imgError } = await supabase
            .from("products")
            .update({ images: imageUrls })
            .eq("id", product.id);
          if (imgError) throw imgError;
          product.images = imageUrls;
        }

        setProducts((prev) => [...prev, product]);
      }
      resetForm();
    } catch (err) {
      toast({
        title: "შეცდომა",
        description:
          err instanceof Error ? err.message : "შენახვა ვერ მოხერხდა",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      toast({
        title: "შეცდომა",
        description: err instanceof Error ? err.message : "წაშლა ვერ მოხერხდა",
        variant: "destructive",
      });
    }
  }

  if (loading || productsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="mx-auto h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => (
          <div key={step.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                  step.num < CURRENT_STEP
                    ? "border-primary bg-primary text-primary-foreground"
                    : step.num === CURRENT_STEP
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground",
                )}
              >
                {step.num < CURRENT_STEP ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.num
                )}
              </div>
              <span
                className={cn(
                  "mt-1 text-[10px]",
                  step.num === CURRENT_STEP
                    ? "font-bold text-on-surface"
                    : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-0.5 w-8 sm:w-12",
                  step.num < CURRENT_STEP
                    ? "bg-primary"
                    : "bg-muted-foreground/30",
                )}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>პროდუქტები</CardTitle>
              <CardDescription>
                დაამატეთ თქვენი პროდუქტები კატალოგში
              </CardDescription>
            </div>
            {!showForm && (
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="mr-1 h-4 w-4" />
                დამატება
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Add/Edit Form */}
          {showForm && (
            <div className="space-y-4 rounded-lg bg-surface-container-low p-4">
              <div className="space-y-2">
                <Label>პროდუქტის სახელი</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="მაგ: უკაბელო კამერა"
                />
                {formErrors.name && (
                  <p className="text-xs text-destructive">{formErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>ფასი (₾)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                  />
                  {formErrors.price && (
                    <p className="text-xs text-destructive">
                      {formErrors.price}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>მარაგი</Label>
                  <Input
                    type="number"
                    value={stockQty}
                    onChange={(e) => setStockQty(e.target.value)}
                    placeholder="0"
                  />
                  {formErrors.stock_quantity && (
                    <p className="text-xs text-destructive">
                      {formErrors.stock_quantity}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>აღწერა</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="პროდუქტის მოკლე აღწერა (არასავალდებულო)"
                  maxLength={500}
                />
                {formErrors.description && (
                  <p className="text-xs text-destructive">
                    {formErrors.description}
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>სურათები (მაქს. 5)</Label>
                <div className="flex flex-wrap gap-2">
                  {imagePreviews.map((preview, idx) => (
                    <div key={idx} className="group relative">
                      <img
                        src={preview}
                        alt={`Preview ${idx + 1}`}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {imagePreviews.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 transition-colors hover:border-primary/50"
                    >
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddOrUpdate} disabled={saving}>
                  {saving ? "ინახება..." : editingId ? "განახლება" : "დამატება"}
                </Button>
                <Button size="sm" variant="ghost" onClick={resetForm}>
                  გაუქმება
                </Button>
              </div>
            </div>
          )}

          {/* Product List */}
          {products.length > 0 ? (
            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 rounded-lg bg-surface-container-low p-3"
                >
                  {product.images?.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-high">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-on-surface">
                      {product.name}
                    </p>
                    <p className="text-sm text-on-surface-variant">
                      {formatGEL(product.price)} · მარაგი:{" "}
                      {product.stock_quantity}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(product)}
                      className="h-8 w-8"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(product.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !showForm && (
              <div className="flex flex-col items-center py-8">
                <Package className="mb-2 h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  ჯერ პროდუქტები არ არის დამატებული
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  პირველი პროდუქტის დამატება
                </Button>
              </div>
            )
          )}
        </CardContent>

        <CardFooter className="justify-between">
          <Button variant="outline" onClick={() => router.push("/step-2")}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            უკან
          </Button>
          <Button
            onClick={() => router.push("/step-4")}
            disabled={products.length < 1}
          >
            შემდეგი
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
