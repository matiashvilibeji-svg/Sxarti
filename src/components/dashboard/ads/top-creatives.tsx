"use client";

interface Creative {
  name: string;
  thumbnailUrl: string | null;
  ctr: number;
}

interface TopCreativesProps {
  creatives: Creative[];
}

export function TopCreatives({ creatives }: TopCreativesProps) {
  if (creatives.length === 0) return null;

  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm">
      <h4 className="mb-6 text-xl font-bold text-on-surface">
        საუკეთესო კრეატივები
      </h4>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {creatives.map((c, i) => (
          <div key={i} className="group">
            <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-surface-container-low">
              {c.thumbnailUrl ? (
                <img
                  alt={`${c.name} — CTR ${c.ctr.toFixed(1)}%`}
                  src={c.thumbnailUrl}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-4xl text-on-surface-variant/30"
                  aria-hidden="true"
                >
                  &#128247;
                </div>
              )}
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-[10px] font-bold text-white">
                  {c.ctr.toFixed(1)}% CTR
                </span>
              </div>
            </div>
            <p className="truncate text-[10px] font-bold uppercase text-on-surface-variant">
              {c.name}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
