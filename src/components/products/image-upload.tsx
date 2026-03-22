"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { useSupabase } from "@/hooks/use-supabase";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  images: string[];
  onImagesChange: (urls: string[]) => void;
  tenantId: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ImageUpload({
  images,
  onImagesChange,
  tenantId,
}: ImageUploadProps) {
  const supabase = useSupabase();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const validFiles = Array.from(files).filter((file) => {
        if (!ACCEPTED_TYPES.includes(file.type)) return false;
        if (file.size > MAX_FILE_SIZE) return false;
        return true;
      });

      if (validFiles.length === 0) return;

      setUploading(true);
      const newUrls: string[] = [];

      for (const file of validFiles) {
        const ext = file.name.split(".").pop();
        const path = `${tenantId}/${crypto.randomUUID()}.${ext}`;

        const { error } = await supabase.storage
          .from("product-images")
          .upload(path, file);

        if (!error) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("product-images").getPublicUrl(path);
          newUrls.push(publicUrl);
        }
      }

      if (newUrls.length > 0) {
        onImagesChange([...images, ...newUrls]);
      }
      setUploading(false);
    },
    [supabase, tenantId, images, onImagesChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      uploadFiles(e.dataTransfer.files);
    },
    [uploadFiles],
  );

  const handleRemove = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-outline/30 hover:border-outline/50",
        )}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : (
          <>
            <Upload className="mb-2 h-8 w-8 text-on-surface-variant" />
            <p className="text-sm text-on-surface-variant">
              ჩააგდეთ სურათები ან დააწკაპუნეთ
            </p>
            <p className="mt-1 text-xs text-on-surface-variant/60">
              JPG, PNG, WebP — მაქს. 5MB
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, i) => (
            <div key={url} className="group relative">
              <img
                src={url}
                alt={`Product ${i + 1}`}
                className="h-20 w-20 rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
