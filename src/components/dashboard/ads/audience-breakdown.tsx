"use client";

interface AgeGroup {
  label: string;
  percentage: number;
}

interface AudienceBreakdownProps {
  ageGroups: AgeGroup[];
  malePercent: number;
  femalePercent: number;
}

export function AudienceBreakdown({
  ageGroups,
  malePercent,
  femalePercent,
}: AudienceBreakdownProps) {
  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm">
      <h4 className="mb-6 text-xl font-bold text-on-surface">
        აუდიტორიის ანალიზი
      </h4>
      <div className="space-y-6">
        <div>
          <div className="mb-2 flex justify-between text-xs font-bold uppercase text-on-surface-variant">
            <span>ასაკი</span>
            <span>პროცენტი</span>
          </div>
          <div className="space-y-3">
            {ageGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="mb-1 flex justify-between text-[10px] font-bold">
                  <span>{group.label}</span>
                  <span>{group.percentage}%</span>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-low"
                  role="progressbar"
                  aria-valuenow={group.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${group.label}: ${group.percentage}%`}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${group.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-surface-container pt-4">
          <div className="flex items-center gap-8">
            <div className="flex flex-1 flex-col items-center">
              <span className="mb-1 text-2xl text-primary">&#9794;</span>
              <span className="text-sm font-black text-on-surface">
                {malePercent}%
              </span>
              <span className="text-[10px] font-bold uppercase text-on-surface-variant">
                კაცი
              </span>
            </div>
            <div className="h-8 w-px bg-surface-container" />
            <div className="flex flex-1 flex-col items-center">
              <span className="mb-1 text-2xl text-[#5c00ca]">&#9792;</span>
              <span className="text-sm font-black text-on-surface">
                {femalePercent}%
              </span>
              <span className="text-[10px] font-bold uppercase text-on-surface-variant">
                ქალი
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
