import { Skeleton } from "@/components/ui/skeleton";

export default function BusinessesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="rounded-lg bg-surface-container-lowest ghost-border">
        <Skeleton className="h-12 rounded-t-lg" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="mx-4 my-2 h-14 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
