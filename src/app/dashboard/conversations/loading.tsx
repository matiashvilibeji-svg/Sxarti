import { Skeleton } from "@/components/ui/skeleton";

export default function ConversationsLoading() {
  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)]">
      {/* Left panel — conversation list */}
      <div className="w-80 shrink-0 border-r border-outline-variant/20 bg-surface-container-lowest p-4 space-y-3">
        <Skeleton className="h-10 rounded-lg" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>

      {/* Center panel — chat placeholder */}
      <div className="flex-1 bg-surface-container-lowest flex items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    </div>
  );
}
