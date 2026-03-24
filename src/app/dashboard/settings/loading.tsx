import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div>
      <Skeleton className="h-7 w-36" />
      <Skeleton className="mt-1 h-5 w-64" />

      {/* Tabs */}
      <Skeleton className="mt-6 h-10 w-full rounded-lg" />

      {/* Tab content */}
      <div className="mt-6 space-y-6">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}
