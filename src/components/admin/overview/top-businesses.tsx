import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

interface TopBusiness {
  id: string;
  business_name: string;
  subscription_plan: "starter" | "business" | "premium";
  conversations_this_month: number;
  subscription_status: string;
}

interface TopBusinessesProps {
  businesses: TopBusiness[];
}

const planColors: Record<string, string> = {
  premium: "bg-primary/10 text-primary",
  business: "bg-secondary/10 text-secondary",
  starter: "bg-surface-container-high text-on-surface-variant",
};

export function TopBusinesses({ businesses }: TopBusinessesProps) {
  return (
    <Card className="overflow-hidden rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Top Performing Businesses</CardTitle>
        <CardDescription>
          Ranked by conversation volume and plan tier.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-surface-container-high bg-surface-container-low/50">
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  #
                </th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Business
                </th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Plan
                </th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Conversations
                </th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/50">
              {businesses.map((biz, idx) => (
                <tr
                  key={biz.id}
                  className="transition-colors hover:bg-surface-container-low/30"
                >
                  <td className="px-6 py-4 font-mono font-bold text-primary">
                    #{String(idx + 1).padStart(2, "0")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                        {biz.business_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-on-surface">
                        {biz.business_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${planColors[biz.subscription_plan] ?? ""}`}
                    >
                      {biz.subscription_plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-on-surface">
                    {biz.conversations_this_month.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${biz.subscription_status === "active" ? "bg-green-500" : "bg-orange-400"}`}
                      />
                      <span className="text-sm capitalize text-on-surface-variant">
                        {biz.subscription_status}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {businesses.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-on-surface-variant"
                  >
                    No businesses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
