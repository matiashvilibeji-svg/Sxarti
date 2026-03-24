import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-10 w-44" />
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[180px]" />
      </div>

      {/* Table */}
      <div className="rounded-lg bg-surface-container-lowest ghost-border">
        <Skeleton className="h-12 rounded-t-lg" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="mx-4 my-2 h-14 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
