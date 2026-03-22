import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ka } from "date-fns/locale";
import type { Conversation } from "@/types/database";

interface AttentionConversationsProps {
  conversations: Conversation[];
}

export function AttentionConversations({
  conversations,
}: AttentionConversationsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-lg">ყურადღება საჭიროა</CardTitle>
        </div>
        {conversations.length > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            {conversations.length}
          </span>
        )}
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <p className="py-8 text-center text-sm text-on-surface-variant">
            ყველაფერი რიგზეა
          </p>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="flex items-center justify-between rounded-lg border border-surface-container-high p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {(conv.customer_name ?? "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-on-surface">
                      {conv.customer_name ?? "უცნობი"}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {conv.handoff_reason ?? "გადაცემულია ოპერატორზე"}
                      {conv.handed_off_at && (
                        <>
                          {" "}
                          &middot;{" "}
                          {formatDistanceToNow(new Date(conv.handed_off_at), {
                            locale: ka,
                            addSuffix: true,
                          })}
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/conversations">გახსნა</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
