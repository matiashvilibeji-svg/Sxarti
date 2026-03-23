"use client";

import { Package, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StockIndicator } from "./stock-indicator";
import { formatGEL } from "@/lib/utils/currency";
import type { Product } from "@/types/database";

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  return (
    <Card className="group overflow-hidden">
      <div className="relative aspect-square bg-surface-container-low">
        {(product.images ?? []).length > 0 ? (
          <img
            src={(product.images ?? [])[0]}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-12 w-12 text-on-surface-variant/40" />
          </div>
        )}
        <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(product)}>
                <Pencil className="mr-2 h-4 w-4" />
                რედაქტირება
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(product)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                წაშლა
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="truncate text-sm font-medium text-on-surface">
          {product.name}
        </h3>
        <p className="mt-1 text-lg font-semibold text-on-surface">
          {formatGEL(product.price ?? 0)}
        </p>
        <div className="mt-2">
          <StockIndicator
            stock_quantity={product.stock_quantity ?? 0}
            low_stock_threshold={product.low_stock_threshold ?? 5}
          />
        </div>
      </CardContent>
    </Card>
  );
}
