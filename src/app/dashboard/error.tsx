"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-lg font-semibold text-on-surface">
        დაფიქსირდა შეცდომა
      </h2>
      <p className="max-w-sm text-sm text-on-surface-variant">
        გვერდის ჩატვირთვისას მოხდა შეცდომა. გთხოვთ სცადოთ თავიდან.
      </p>
      <Button onClick={reset}>თავიდან ცდა</Button>
    </div>
  );
}
