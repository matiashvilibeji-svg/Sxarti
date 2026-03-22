import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatGEL } from "@/lib/utils/currency";
import { Package } from "lucide-react";

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
  image?: string;
}

interface TopProductsProps {
  products: TopProduct[];
}

export function TopProducts({ products }: TopProductsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">ტოპ პროდუქტები</CardTitle>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="py-8 text-center text-sm text-on-surface-variant">
            მონაცემები ჯერ არ არის
          </p>
        ) : (
          <div className="space-y-3">
            {products.map((product, i) => (
              <div key={product.name} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-container-low text-xs font-semibold text-on-surface-variant">
                  {i + 1}
                </span>
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-low">
                    <Package className="h-5 w-5 text-on-surface-variant" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-on-surface">
                    {product.name}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {product.sales} გაყიდვა
                  </p>
                </div>
                <p className="text-sm font-medium text-on-surface">
                  {formatGEL(product.revenue)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
