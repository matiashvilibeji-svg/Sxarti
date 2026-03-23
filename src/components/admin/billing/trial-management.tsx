"use client";

import { useState } from "react";
import { Timer, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface TrialTenant {
  id: string;
  business_name: string;
  trial_ends_at: string;
  created_at: string;
}

interface TrialManagementProps {
  trials: TrialTenant[];
  onTrialExtended: () => void;
}

function getDaysRemaining(trialEndsAt: string): number {
  const now = new Date();
  const end = new Date(trialEndsAt);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getDaysColor(days: number): string {
  if (days <= 2) return "bg-destructive/10 text-destructive";
  if (days <= 5) return "bg-amber-100 text-amber-700";
  return "bg-primary/10 text-primary";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TrialManagement({
  trials,
  onTrialExtended,
}: TrialManagementProps) {
  const [extendingId, setExtendingId] = useState<string | null>(null);

  const handleExtendTrial = async (
    tenantId: string,
    currentEndDate: string,
    days: number,
  ) => {
    setExtendingId(tenantId);
    try {
      const supabase = createClient();
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + days);

      const { error } = await supabase
        .from("tenants")
        .update({ trial_ends_at: newEndDate.toISOString() })
        .eq("id", tenantId);

      if (error) throw error;
      onTrialExtended();
    } catch {
      // Error handled silently
    } finally {
      setExtendingId(null);
    }
  };

  // Sort by soonest expiring
  const sortedTrials = [...trials].sort(
    (a, b) =>
      new Date(a.trial_ends_at).getTime() - new Date(b.trial_ends_at).getTime(),
  );

  const expiringThisWeek = sortedTrials.filter(
    (t) => getDaysRemaining(t.trial_ends_at) <= 7,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-bold text-on-surface">Trial Management</h3>
        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded">
          {trials.length} SESSIONS ACTIVE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sortedTrials.slice(0, 3).map((trial) => {
          const daysLeft = getDaysRemaining(trial.trial_ends_at);
          const colorClass = getDaysColor(daysLeft);
          const initial = trial.business_name.charAt(0).toUpperCase();

          return (
            <Card
              key={trial.id}
              className="p-4 flex justify-between items-center group bg-surface-container-lowest shadow-sm border border-surface-container"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-surface-container-low rounded-lg flex items-center justify-center font-bold text-on-surface-variant">
                  {initial}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-on-surface">
                    {trial.business_name}
                  </h4>
                  <p className="text-[10px] text-on-surface-variant">
                    Started: {formatDate(trial.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={cn(
                    "px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1",
                    colorClass,
                  )}
                >
                  <Timer className="h-3 w-3" />
                  {daysLeft} Days Left
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      onClick={() =>
                        handleExtendTrial(trial.id, trial.trial_ends_at, days)
                      }
                      disabled={extendingId === trial.id}
                      className="text-[9px] font-bold text-primary hover:underline underline-offset-2"
                    >
                      +{days}d
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {trials.length > 3 && (
        <div className="flex justify-end">
          <button className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
            View all {trials.length} trials
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
