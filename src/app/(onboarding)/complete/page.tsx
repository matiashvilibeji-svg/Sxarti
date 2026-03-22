"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Shield, Headphones, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const FEATURES = [
  { icon: Shield, label: "უსაფრთხოება" },
  { icon: Headphones, label: "24/7 მხარდაჭერა" },
  { icon: Zap, label: "მყისიერი აქტივაცია" },
];

export default function CompletePage() {
  const router = useRouter();
  const { toast } = useToast();

  return (
    <div className="flex flex-col items-center space-y-8 py-8 text-center">
      {/* Success Icon with Sparkles */}
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle2 className="h-14 w-14 text-green-500" />
        </div>
        {/* Decorative sparkles */}
        <div className="absolute -right-2 -top-1 h-3 w-3 animate-pulse rounded-full bg-yellow-400" />
        <div className="absolute -left-3 top-4 h-2 w-2 animate-pulse rounded-full bg-primary delay-150" />
        <div className="absolute -bottom-1 right-0 h-2.5 w-2.5 animate-pulse rounded-full bg-green-400 delay-300" />
      </div>

      {/* Heading */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-display text-on-surface">
          თქვენი AI ასისტენტი მზადაა!
        </h1>
        <p className="mx-auto max-w-md text-on-surface-variant">
          ყველა პარამეტრი წარმატებით შეინახა. თქვენი ბოტი მზადაა კლიენტებთან
          საუბრის დასაწყებად.
        </p>
      </div>

      {/* CTA Buttons */}
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Button size="lg" onClick={() => router.push("/dashboard/overview")}>
          გადავიდე Dashboard-ზე
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() =>
            toast({
              title: "ტესტ. შეტყობინება",
              description: "ეს ფუნქცია მალე დაემატება",
            })
          }
        >
          გაგზავნე ტესტ. შეტყობინება
        </Button>
      </div>

      {/* Feature Badges */}
      <div className="flex gap-6 pt-4">
        {FEATURES.map((feature) => (
          <div
            key={feature.label}
            className="flex flex-col items-center gap-1.5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low">
              <feature.icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs text-on-surface-variant">
              {feature.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
