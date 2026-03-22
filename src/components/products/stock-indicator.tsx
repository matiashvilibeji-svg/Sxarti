import { cn } from "@/lib/utils";

interface StockIndicatorProps {
  stock_quantity: number;
  low_stock_threshold: number;
  className?: string;
}

export function StockIndicator({
  stock_quantity,
  low_stock_threshold,
  className,
}: StockIndicatorProps) {
  const { label, classes } = getStockStatus(
    stock_quantity,
    low_stock_threshold,
  );

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        classes,
        className,
      )}
    >
      {label}
    </span>
  );
}

function getStockStatus(quantity: number, threshold: number) {
  if (quantity === 0) {
    return { label: "ამოიწურა", classes: "bg-destructive/10 text-destructive" };
  }
  if (quantity <= threshold) {
    return { label: "მცირე მარაგი", classes: "bg-amber-100 text-amber-700" };
  }
  return { label: "მარაგშია", classes: "bg-secondary/10 text-secondary" };
}
