"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Briefcase,
  Smile,
  Rocket,
  Check,
  ChevronRight,
  Upload,
} from "lucide-react";
import { useSupabase } from "@/hooks/use-supabase";
import { useTenant } from "@/hooks/use-tenant";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "ბიზნეს პროფილი", num: 1 },
  { label: "Facebook", num: 2 },
  { label: "პროდუქტები", num: 3 },
  { label: "მიწოდება", num: 4 },
  { label: "გადახდა", num: 5 },
];
const CURRENT_STEP = 1;

const TONES = [
  { value: "formal" as const, label: "ფორმალური", icon: Briefcase },
  { value: "friendly" as const, label: "მეგობრული", icon: Smile },
  { value: "casual" as const, label: "თავისუფალი", icon: Rocket },
];

const schema = z.object({
  business_name: z
    .string()
    .min(2, "ბიზნესის სახელი სავალდებულოა (მინ. 2 სიმბოლო)"),
  bot_persona_name: z.string().min(1, "ბოტის სახელი სავალდებულოა"),
  bot_tone: z.enum(["formal", "friendly", "casual"], {
    required_error: "აირჩიეთ ტონი",
  }),
});

export default function Step1Page() {
  const router = useRouter();
  const supabase = useSupabase();
  const { tenant, loading } = useTenant();
  const { toast } = useToast();

  const [businessName, setBusinessName] = useState("");
  const [personaName, setPersonaName] = useState("ანა");
  const [tone, setTone] = useState<"formal" | "friendly" | "casual">(
    "friendly",
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tenant) {
      setBusinessName(tenant.business_name || "");
      setPersonaName(tenant.bot_persona_name || "ანა");
      setTone(tenant.bot_tone || "friendly");
      if (tenant.logo_url) setLogoPreview(tenant.logo_url);
    }
  }, [tenant]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "ფაილი ძალიან დიდია",
        description: "მაქსიმუმ 2MB",
        variant: "destructive",
      });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({
        title: "მხოლოდ სურათი",
        description: "აირჩიეთ სურათის ფაილი",
        variant: "destructive",
      });
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    const result = schema.safeParse({
      business_name: businessName,
      bot_persona_name: personaName,
      bot_tone: tone,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSaving(true);

    try {
      let logoUrl = tenant?.logo_url ?? null;

      if (logoFile && tenant) {
        const ext = logoFile.name.split(".").pop();
        const path = `${tenant.id}/logo.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("logos")
          .upload(path, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("logos")
          .getPublicUrl(path);
        logoUrl = publicData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("tenants")
        .update({
          business_name: businessName,
          logo_url: logoUrl,
          bot_persona_name: personaName,
          bot_tone: tone,
        })
        .eq("id", tenant!.id);

      if (updateError) throw updateError;

      router.push("/step-2");
    } catch (err) {
      toast({
        title: "შეცდომა",
        description:
          err instanceof Error
            ? err.message
            : "ცვლილებების შენახვა ვერ მოხერხდა",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="mx-auto h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => (
          <div key={step.num} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                  step.num < CURRENT_STEP
                    ? "border-primary bg-primary text-primary-foreground"
                    : step.num === CURRENT_STEP
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 text-muted-foreground",
                )}
              >
                {step.num < CURRENT_STEP ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.num
                )}
              </div>
              <span
                className={cn(
                  "mt-1 text-[10px]",
                  step.num === CURRENT_STEP
                    ? "font-bold text-on-surface"
                    : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-0.5 w-8 sm:w-12",
                  step.num < CURRENT_STEP
                    ? "bg-primary"
                    : "bg-muted-foreground/30",
                )}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ბიზნეს პროფილი</CardTitle>
          <CardDescription>
            შეავსეთ თქვენი ბიზნესის ძირითადი ინფორმაცია
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="business_name">ბიზნესის სახელი</Label>
            <Input
              id="business_name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="მაგ: ჩემი მაღაზია"
            />
            {errors.business_name && (
              <p className="text-xs text-destructive">{errors.business_name}</p>
            )}
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>ლოგო</Label>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 transition-colors hover:border-primary/50 hover:bg-surface-container-low"
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-20 w-20 rounded-lg object-cover"
                />
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    ჩააგდეთ ან დააჭირეთ ასატვირთად
                  </p>
                  <p className="text-xs text-muted-foreground">მაქს. 2MB</p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Bot Persona Name */}
          <div className="space-y-2">
            <Label htmlFor="persona_name">ბოტის სახელი</Label>
            <Input
              id="persona_name"
              value={personaName}
              onChange={(e) => setPersonaName(e.target.value)}
              placeholder="მაგ: ანა"
            />
            {errors.bot_persona_name && (
              <p className="text-xs text-destructive">
                {errors.bot_persona_name}
              </p>
            )}
          </div>

          {/* Bot Tone */}
          <div className="space-y-2">
            <Label>ბოტის ტონი</Label>
            <div className="grid grid-cols-3 gap-3">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(t.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg p-4 transition-all",
                    tone === t.value
                      ? "bg-primary/10 ring-2 ring-primary"
                      : "ghost-border hover:bg-surface-container-low",
                  )}
                >
                  <t.icon
                    className={cn(
                      "h-6 w-6",
                      tone === t.value
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm",
                      tone === t.value
                        ? "font-medium text-primary"
                        : "text-on-surface-variant",
                    )}
                  >
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
            {errors.bot_tone && (
              <p className="text-xs text-destructive">{errors.bot_tone}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="justify-end">
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "ინახება..." : "შემდეგი"}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
