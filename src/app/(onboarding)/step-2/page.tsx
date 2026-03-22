"use client";

import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Zap,
} from "lucide-react";
import { useTenant } from "@/hooks/use-tenant";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
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
const CURRENT_STEP = 2;

export default function Step2Page() {
  const router = useRouter();
  const { loading } = useTenant();
  const { toast } = useToast();

  function handleConnect() {
    toast({
      title: "Facebook-ის ინტეგრაცია მალე!",
      description: "ეს ფუნქცია მალე დაემატება",
    });
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
        <CardHeader className="text-center">
          <CardTitle>Facebook-თან დაკავშირება</CardTitle>
          <CardDescription>
            დააკავშირეთ თქვენი Facebook გვერდი ბოტის გასააქტიურებლად
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center space-y-8 py-8">
          {/* Connection Illustration */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Zap className="h-8 w-8 text-primary" />
            </div>
            <div className="flex gap-1">
              <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />
              <div className="h-2 w-2 rounded-full bg-muted-foreground/10" />
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10">
              <MessageCircle className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          {/* Info Banner */}
          <div className="rounded-lg bg-surface-container-low px-4 py-3 text-center text-sm text-on-surface-variant">
            სხარტი მხოლოდ შეტყობინებებს მართავს — თქვენი გვერდის სხვა მონაცემები
            არ იცვლება
          </div>

          {/* Connect Button */}
          <Button size="lg" onClick={handleConnect} className="w-full max-w-xs">
            Facebook-თან დაკავშირება
          </Button>

          {/* Skip Link */}
          <Button
            variant="ghost"
            onClick={() => router.push("/step-3")}
            className="text-muted-foreground"
          >
            გამოტოვება
          </Button>

          {/* Security Notice */}
          <p className="text-center text-xs text-muted-foreground">
            თქვენი მონაცემები დაცულია და არ გაზიარდება მესამე მხარესთან
          </p>
        </CardContent>

        <CardFooter className="justify-between">
          <Button variant="outline" onClick={() => router.push("/step-1")}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            უკან
          </Button>
          <Button variant="outline" onClick={() => router.push("/step-3")}>
            შემდეგი
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
