import { Skeleton } from "@/components/ui/skeleton";

export default function DeliveryZonesLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Zone table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-[0_20px_40px_rgba(11,28,48,0.03)]">
        <Skeleton className="h-10 rounded-none" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="mx-4 my-2 h-16 rounded-lg" />
        ))}
      </div>

      {/* AI card */}
      <Skeleton className="h-24 rounded-xl" />
    </div>
  );
}
