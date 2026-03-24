"use client";

import { EmptyState } from "@/components/shared/empty-state";
import { Loading } from "@/components/shared/loading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useSupabase } from "@/hooks/use-supabase";
import { useTenant } from "@/hooks/use-tenant";
import type { FAQ, Tenant } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import {
  Bell,
  Bot,
  CreditCard,
  HelpCircle,
  Link2,
  Pencil,
  Plus,
  Save,
  Settings,
  Trash2,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function SettingsPage() {
  const { tenant, setTenant, loading, error } = useTenant();

  if (loading) return <Loading />;
  if (error || !tenant) {
    return (
      <EmptyState
        icon={Settings}
        title="შეცდომა"
        description={error || "ტენანტი ვერ მოიძებნა"}
      />
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-on-surface">პარამეტრები</h1>
      <p className="mt-1 text-sm text-on-surface-variant/70">
        მართეთ თქვენი ბიზნესის და ბოტის პარამეტრები
      </p>

      <Tabs defaultValue="profile" className="mt-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" className="gap-1.5 text-xs">
            <User className="h-3.5 w-3.5" />
            პროფილი
          </TabsTrigger>
          <TabsTrigger value="bot" className="gap-1.5 text-xs">
            <Bot className="h-3.5 w-3.5" />
            ბოტი
          </TabsTrigger>
          <TabsTrigger value="connections" className="gap-1.5 text-xs">
            <Link2 className="h-3.5 w-3.5" />
            კავშირები
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 text-xs">
            <Bell className="h-3.5 w-3.5" />
            შეტყობინებები
          </TabsTrigger>
          <TabsTrigger value="faq" className="gap-1.5 text-xs">
            <HelpCircle className="h-3.5 w-3.5" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-1.5 text-xs">
            <CreditCard className="h-3.5 w-3.5" />
            გამოწერა
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="profile">
            <ProfileTab tenant={tenant} setTenant={setTenant} />
          </TabsContent>
          <TabsContent value="bot">
            <BotTab tenant={tenant} setTenant={setTenant} />
          </TabsContent>
          <TabsContent value="connections">
            <ConnectionsTab tenant={tenant} />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationsTab tenant={tenant} setTenant={setTenant} />
          </TabsContent>
          <TabsContent value="faq">
            <FAQTab tenant={tenant} />
          </TabsContent>
          <TabsContent value="subscription">
            <SubscriptionTab tenant={tenant} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// ─── Profile Tab ─────────────────────────────────────────────

function ProfileTab({
  tenant,
  setTenant,
}: {
  tenant: Tenant;
  setTenant: (t: Tenant | null) => void;
}) {
  const supabase = useSupabase();
  const { toast } = useToast();
  const [businessName, setBusinessName] = useState(tenant.business_name);
  const [logoUrl, setLogoUrl] = useState(tenant.logo_url ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const updates = {
      business_name: businessName,
      logo_url: logoUrl || null,
    };
    const { error } = await supabase
      .from("tenants")
      .update(updates)
      .eq("id", tenant.id);
    setSaving(false);
    if (error) {
      toast({
        title: "შეცდომა",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setTenant({ ...tenant, ...updates });
      toast({ title: "შენახულია", description: "პროფილი წარმატებით განახლდა" });
    }
  };

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="text-base">ბიზნეს პროფილი</CardTitle>
        <CardDescription>თქვენი ბიზნესის ძირითადი ინფორმაცია</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="business-name">ბიზნესის სახელი</Label>
          <Input
            id="business-name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="logo-url">ლოგოს URL</Label>
          <Input
            id="logo-url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-cta hover:bg-gradient-cta-hover"
        >
          <Save className="mr-1.5 h-4 w-4" />
          {saving ? "ინახება..." : "შენახვა"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Bot Tab ─────────────────────────────────────────────────

function BotTab({
  tenant,
  setTenant,
}: {
  tenant: Tenant;
  setTenant: (t: Tenant | null) => void;
}) {
  const supabase = useSupabase();
  const { toast } = useToast();
  const [personaName, setPersonaName] = useState(tenant.bot_persona_name);
  const [tone, setTone] = useState(tenant.bot_tone);
  const [bogIban, setBogIban] = useState(
    tenant.payment_details?.bog_iban ?? "",
  );
  const [tbcAccount, setTbcAccount] = useState(
    tenant.payment_details?.tbc_account ?? "",
  );
  const [paymentInstructions, setPaymentInstructions] = useState(
    tenant.payment_details?.instructions ?? "",
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const updates = {
      bot_persona_name: personaName,
      bot_tone: tone,
      payment_details: {
        bog_iban: bogIban || undefined,
        tbc_account: tbcAccount || undefined,
        instructions: paymentInstructions || undefined,
      },
    };
    const { error } = await supabase
      .from("tenants")
      .update(updates)
      .eq("id", tenant.id);
    setSaving(false);
    if (error) {
      toast({
        title: "შეცდომა",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setTenant({ ...tenant, ...updates });
      toast({ title: "შენახულია", description: "ბოტის პარამეტრები განახლდა" });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base">ბოტის პერსონა</CardTitle>
          <CardDescription>
            მორგეთ ბოტის სახელი და კომუნიკაციის ტონი
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="persona-name">ბოტის სახელი</Label>
            <Input
              id="persona-name"
              value={personaName}
              onChange={(e) => setPersonaName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tone">კომუნიკაციის ტონი</Label>
            <Select
              value={tone}
              onValueChange={(v) => setTone(v as Tenant["bot_tone"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">ფორმალური</SelectItem>
                <SelectItem value="friendly">მეგობრული</SelectItem>
                <SelectItem value="casual">არაფორმალური</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base">გადახდის დეტალები</CardTitle>
          <CardDescription>
            ბოტი ამ ინფორმაციას გაუზიარებს მომხმარებელს
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bog-iban">BOG IBAN</Label>
            <Input
              id="bog-iban"
              value={bogIban}
              onChange={(e) => setBogIban(e.target.value)}
              placeholder="GE00BG..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tbc-account">TBC ანგარიში</Label>
            <Input
              id="tbc-account"
              value={tbcAccount}
              onChange={(e) => setTbcAccount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment-instructions">გადახდის ინსტრუქცია</Label>
            <Textarea
              id="payment-instructions"
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="bg-gradient-cta hover:bg-gradient-cta-hover"
      >
        <Save className="mr-1.5 h-4 w-4" />
        {saving ? "ინახება..." : "შენახვა"}
      </Button>
    </div>
  );
}

// ─── Connections Tab ─────────────────────────────────────────

function ConnectionsTab({ tenant }: { tenant: Tenant }) {
  return (
    <div className="space-y-6">
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base">Facebook Messenger</CardTitle>
          <CardDescription>დააკავშირეთ Facebook გვერდი ბოტთან</CardDescription>
        </CardHeader>
        <CardContent>
          {tenant.facebook_page_id ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-on-surface">
                  დაკავშირებულია
                </p>
                <p className="text-xs text-on-surface-variant/60">
                  Page ID: {tenant.facebook_page_id}
                </p>
              </div>
              <Button variant="outline" size="sm" className="text-destructive">
                გათიშვა
              </Button>
            </div>
          ) : (
            <Button className="bg-[#0084FF] hover:bg-[#0073e6] text-white">
              Facebook-ის დაკავშირება
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base">Instagram</CardTitle>
          <CardDescription>
            დააკავშირეთ Instagram ბიზნეს ანგარიში
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tenant.instagram_account_id ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-on-surface">
                  დაკავშირებულია
                </p>
                <p className="text-xs text-on-surface-variant/60">
                  Account ID: {tenant.instagram_account_id}
                </p>
              </div>
              <Button variant="outline" size="sm" className="text-destructive">
                გათიშვა
              </Button>
            </div>
          ) : (
            <Button className="bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white hover:opacity-90">
              Instagram-ის დაკავშირება
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Notifications Tab ───────────────────────────────────────

function NotificationsTab({
  tenant,
  setTenant,
}: {
  tenant: Tenant;
  setTenant: (t: Tenant | null) => void;
}) {
  const supabase = useSupabase();
  const { toast } = useToast();
  const [whatsapp, setWhatsapp] = useState(
    tenant.notification_config?.whatsapp_number ?? "",
  );
  const [telegram, setTelegram] = useState(
    tenant.notification_config?.telegram_chat_id ?? "",
  );
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {
      new_order: true,
      handoff: true,
      low_stock: false,
      daily_summary: false,
      problematic: true,
    };
    return { ...defaults, ...tenant.notification_config?.preferences };
  });
  const [saving, setSaving] = useState(false);

  const togglePref = (key: string) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    const updates = {
      notification_config: {
        whatsapp_number: whatsapp || undefined,
        telegram_chat_id: telegram || undefined,
        preferences: prefs,
      },
    };
    const { error } = await supabase
      .from("tenants")
      .update(updates)
      .eq("id", tenant.id);
    setSaving(false);
    if (error) {
      toast({
        title: "შეცდომა",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setTenant({ ...tenant, ...updates });
      toast({
        title: "შენახულია",
        description: "შეტყობინებების პარამეტრები განახლდა",
      });
    }
  };

  const prefLabels: Record<string, string> = {
    new_order: "ახალი შეკვეთა",
    handoff: "საუბრის გადაცემა ოპერატორზე",
    low_stock: "მარაგი დაბალია",
    daily_summary: "დღის შეჯამება",
    problematic: "პრობლემური შემთხვევა",
  };

  return (
    <div className="space-y-6">
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base">შეტყობინების არხები</CardTitle>
          <CardDescription>
            მიუთითეთ სად გინდათ შეტყობინებების მიღება
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp ნომერი</Label>
            <Input
              id="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+995..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telegram">Telegram Chat ID</Label>
            <Input
              id="telegram"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="123456789"
            />
            <p className="text-xs text-on-surface-variant/60">
              გაუშვით @userinfobot Telegram-ში თქვენი Chat ID-ის სანახავად
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base">შეტყობინების ტიპები</CardTitle>
          <CardDescription>
            აირჩიეთ რა ტიპის შეტყობინებები გინდათ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(prefLabels).map(([key, label]) => (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-outline-variant/20 p-3 transition-colors hover:bg-surface-container-high"
            >
              <span className="text-sm text-on-surface">{label}</span>
              <input
                type="checkbox"
                checked={prefs[key] ?? false}
                onChange={() => togglePref(key)}
                className="h-4 w-4 rounded accent-primary"
              />
            </label>
          ))}
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="bg-gradient-cta hover:bg-gradient-cta-hover"
      >
        <Save className="mr-1.5 h-4 w-4" />
        {saving ? "ინახება..." : "შენახვა"}
      </Button>
    </div>
  );
}

// ─── FAQ Tab ─────────────────────────────────────────────────

function FAQTab({ tenant }: { tenant: Tenant }) {
  const supabase = useSupabase();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchFaqs = useCallback(async () => {
    const { data } = await supabase
      .from("faqs")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: true });
    setFaqs((data as FAQ[]) ?? []);
    setLoading(false);
  }, [supabase, tenant.id]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  const handleAdd = async () => {
    if (!question.trim() || !answer.trim()) return;
    setSaving(true);
    await supabase.from("faqs").insert({
      tenant_id: tenant.id,
      question: question.trim(),
      answer: answer.trim(),
    });
    setQuestion("");
    setAnswer("");
    setSaving(false);
    fetchFaqs();
  };

  const handleUpdate = async (id: string) => {
    if (!editQuestion.trim() || !editAnswer.trim()) return;
    await supabase
      .from("faqs")
      .update({ question: editQuestion.trim(), answer: editAnswer.trim() })
      .eq("id", id);
    setEditingId(null);
    fetchFaqs();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("faqs").delete().eq("id", deleteId);
    setDeleteId(null);
    fetchFaqs();
  };

  const startEditing = (faq: FAQ) => {
    setEditingId(faq.id);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
  };

  return (
    <div className="space-y-6">
      {/* Add new FAQ */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base">ახალი FAQ დამატება</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="faq-question">კითხვა</Label>
            <Input
              id="faq-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="მაგ: როგორ ხდება მიტანა?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="faq-answer">პასუხი</Label>
            <Textarea
              id="faq-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={3}
              placeholder="ბოტის პასუხი..."
            />
          </div>
          <Button
            onClick={handleAdd}
            disabled={saving || !question.trim() || !answer.trim()}
            className="bg-gradient-cta hover:bg-gradient-cta-hover"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            დამატება
          </Button>
        </CardContent>
      </Card>

      {/* FAQ List */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base">
            არსებული FAQ ({faqs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-on-surface-variant/60">იტვირთება...</p>
          ) : faqs.length === 0 ? (
            <p className="py-6 text-center text-sm text-on-surface-variant/60">
              FAQ ჯერ არ დამატებულა
            </p>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="rounded-lg border border-outline-variant/20 p-3"
                >
                  {editingId === faq.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editQuestion}
                        onChange={(e) => setEditQuestion(e.target.value)}
                      />
                      <Textarea
                        value={editAnswer}
                        onChange={(e) => setEditAnswer(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(faq.id)}
                          className="bg-gradient-cta hover:bg-gradient-cta-hover"
                        >
                          შენახვა
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          გაუქმება
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-on-surface">
                            {faq.question}
                          </p>
                          <p className="mt-1 text-sm text-on-surface-variant/70">
                            {faq.answer}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => startEditing(faq)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => setDeleteId(faq.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>FAQ-ის წაშლა</DialogTitle>
            <DialogDescription>
              დარწმუნებული ხართ, რომ გინდათ ამ კითხვის წაშლა? ეს მოქმედება
              შეუქცევადია.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              გაუქმება
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              წაშლა
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Subscription Tab ────────────────────────────────────────

const plans: {
  id: Tenant["subscription_plan"];
  name: string;
  limit: string;
  price: string;
}[] = [
  { id: "starter", name: "Starter", limit: "100 საუბარი/თვე", price: "₾49" },
  {
    id: "business",
    name: "Business",
    limit: "500 საუბარი/თვე",
    price: "₾149",
  },
  {
    id: "premium",
    name: "Premium",
    limit: "ულიმიტო",
    price: "₾299",
  },
];

function getPlanLimit(plan: Tenant["subscription_plan"]): number {
  switch (plan) {
    case "starter":
      return 100;
    case "business":
      return 500;
    case "premium":
      return Infinity;
  }
}

function SubscriptionTab({ tenant }: { tenant: Tenant }) {
  const currentPlan = plans.find((p) => p.id === tenant.subscription_plan);
  const limit = getPlanLimit(tenant.subscription_plan);
  const usage = tenant.conversations_this_month;
  const usagePercent =
    limit === Infinity ? 0 : Math.min((usage / limit) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base">მიმდინარე გეგმა</CardTitle>
          <CardDescription>
            თქვენი აქტიური სუბსკრიფციის დეტალები
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-on-surface">
                {currentPlan?.name}
              </p>
              <p className="text-sm text-on-surface-variant/70">
                {currentPlan?.price}/თვე
              </p>
            </div>
            <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
              {tenant.subscription_status === "active"
                ? "აქტიური"
                : tenant.subscription_status}
            </span>
          </div>

          <Separator />

          {/* Usage meter */}
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-variant/70">
                საუბრები ამ თვეში
              </span>
              <span className="font-medium text-on-surface">
                {usage} / {limit === Infinity ? "∞" : limit}
              </span>
            </div>
            {limit !== Infinity && (
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container-high">
                <div
                  className="h-full rounded-full bg-gradient-cta transition-all"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan comparison */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-base">გეგმების შედარება</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = plan.id === tenant.subscription_plan;
              return (
                <div
                  key={plan.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/20"
                  }`}
                >
                  <p className="font-semibold text-on-surface">{plan.name}</p>
                  <p className="mt-1 text-2xl font-bold text-on-surface">
                    {plan.price}
                    <span className="text-sm font-normal text-on-surface-variant/60">
                      /თვე
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-on-surface-variant/70">
                    {plan.limit}
                  </p>
                  <Button
                    variant={isCurrent ? "outline" : "default"}
                    size="sm"
                    className={`mt-4 w-full ${!isCurrent ? "bg-gradient-cta hover:bg-gradient-cta-hover" : ""}`}
                    disabled={isCurrent}
                  >
                    {isCurrent ? "მიმდინარე" : "განახლება"}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
