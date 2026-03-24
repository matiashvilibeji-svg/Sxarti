"use client";

import { useState } from "react";
import {
  BarChart3,
  MessageCircle,
  Sparkles,
  Shield,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabase } from "@/hooks/use-supabase";
import { useTenant } from "@/hooks/use-tenant";
import { useToast } from "@/components/ui/use-toast";

interface ConnectScreenProps {
  onConnected?: () => void;
}

export function ConnectScreen({ onConnected }: ConnectScreenProps) {
  const supabase = useSupabase();
  const { tenant } = useTenant();
  const { toast } = useToast();

  const [adAccountId, setAdAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [saving, setSaving] = useState(false);

  const handleConnect = async () => {
    if (!tenant || !adAccountId.trim() || !accessToken.trim()) return;

    setSaving(true);
    try {
      // Validate token by fetching user info
      const meRes = await fetch(
        `https://graph.facebook.com/v19.0/me?access_token=${accessToken.trim()}`,
      );
      const meData = meRes.ok
        ? await meRes.json()
        : { id: "unknown", name: "" };

      if (!meRes.ok) {
        toast({
          title: "არასწორი ტოკენი",
          description:
            "Access Token არავალიდურია. გთხოვთ შეამოწმოთ და სცადოთ თავიდან.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      // Normalize account ID (add act_ prefix if missing)
      let accountId = adAccountId.trim();
      if (!accountId.startsWith("act_")) {
        accountId = `act_${accountId}`;
      }

      // Fetch account name
      const accountRes = await fetch(
        `https://graph.facebook.com/v19.0/${accountId}?fields=name&access_token=${accessToken.trim()}`,
      );
      const accountData = accountRes.ok ? await accountRes.json() : null;

      if (!accountRes.ok) {
        toast({
          title: "ანგარიში ვერ მოიძებნა",
          description:
            "Ad Account ID არასწორია ან ტოკენს არ აქვს წვდომა ამ ანგარიშზე.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const { error } = await supabase.from("meta_ad_accounts").upsert(
        {
          tenant_id: tenant.id,
          meta_user_id: meData.id,
          ad_account_id: accountId,
          access_token: accessToken.trim(),
          account_name: accountData?.name || meData.name || accountId,
        },
        { onConflict: "tenant_id" },
      );

      if (error) {
        toast({
          title: "შეცდომა",
          description: "მონაცემების შენახვა ვერ მოხერხდა.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "წარმატებით დაკავშირდა",
          description: `${accountData?.name || accountId} — დააჭირე სინქრონიზაციას მონაცემების ჩასატვირთად.`,
        });
        onConnected?.();
      }
    } catch {
      toast({
        title: "შეცდომა",
        description: "სერვერთან კავშირი ვერ მოხერხდა.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="max-w-xl">
        <div className="text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#7531e6] shadow-xl shadow-primary/20">
            <BarChart3 className="h-10 w-10 text-white" />
          </div>

          <h2 className="mb-3 text-3xl font-black text-on-surface">
            რეკლამების ანალიზი
          </h2>
          <p className="mb-8 text-base text-on-surface-variant">
            დააკავშირე შენი Facebook Ads ანგარიში და მიიღე AI-ზე დაფუძნებული
            ანალიტიკა და რეკომენდაციები.
          </p>
        </div>

        <div className="mb-8 grid gap-4 text-left sm:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <BarChart3 className="mb-3 h-6 w-6 text-primary" />
            <h3 className="mb-1 text-sm font-bold text-on-surface">
              სრული ანალიტიკა
            </h3>
            <p className="text-xs text-on-surface-variant">
              კამპანიების, აუდიტორიის და კონვერსიების დეტალური ანალიზი
            </p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <MessageCircle className="mb-3 h-6 w-6 text-[#006c49]" />
            <h3 className="mb-1 text-sm font-bold text-on-surface">
              საუბრების კორელაცია
            </h3>
            <p className="text-xs text-on-surface-variant">
              რეკლამებს და Messenger საუბრებს შორის კავშირის აღმოჩენა
            </p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <Sparkles className="mb-3 h-6 w-6 text-[#5c00ca]" />
            <h3 className="mb-1 text-sm font-bold text-on-surface">
              AI რეკომენდაციები
            </h3>
            <p className="text-xs text-on-surface-variant">
              ინტელექტუალური რჩევები ბიუჯეტის და კრეატივების ოპტიმიზაციისთვის
            </p>
          </div>
        </div>

        {/* Manual token entry form */}
        <div className="rounded-2xl border border-outline-variant/10 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-on-surface">
            ანგარიშის დაკავშირება
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ad-account-id" className="text-sm font-semibold">
                Ad Account ID
              </Label>
              <Input
                id="ad-account-id"
                placeholder="act_123456789 ან 123456789"
                value={adAccountId}
                onChange={(e) => setAdAccountId(e.target.value)}
              />
              <p className="text-xs text-on-surface-variant">
                იპოვე{" "}
                <a
                  href="https://adsmanager.facebook.com/adsmanager/manage/accounts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-primary underline"
                >
                  Ads Manager-ში
                  <ExternalLink className="h-3 w-3" />
                </a>{" "}
                → Account ID სვეტში
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="access-token" className="text-sm font-semibold">
                Access Token
              </Label>
              <Input
                id="access-token"
                type="password"
                placeholder="EAAxxxxxxxxx..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
              />
              <p className="text-xs text-on-surface-variant">
                შექმენი{" "}
                <a
                  href="https://developers.facebook.com/tools/explorer/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-primary underline"
                >
                  Graph API Explorer-ში
                  <ExternalLink className="h-3 w-3" />
                </a>{" "}
                → აირჩიე ads_read permission
              </p>
            </div>

            <button
              onClick={handleConnect}
              disabled={saving || !adAccountId.trim() || !accessToken.trim()}
              className="mt-2 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[#1877F2] px-8 py-4 text-base font-extrabold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[#1877F2] focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              )}
              {saving ? "მიმდინარეობს..." : "დაკავშირება"}
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-on-surface-variant">
          <Shield className="h-3.5 w-3.5" />
          <span>
            მხოლოდ წაკითხვის უფლება — სხარტი ვერასდროს შეცვლის შენს რეკლამებს
          </span>
        </div>
      </div>
    </div>
  );
}
