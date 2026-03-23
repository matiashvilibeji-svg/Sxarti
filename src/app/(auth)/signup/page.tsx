"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!businessName || !email || !password || !confirmPassword) {
      setError("ყველა ველის შევსება სავალდებულოა");
      return;
    }

    if (password.length < 8) {
      setError("პაროლი მინიმუმ 8 სიმბოლო უნდა იყოს");
      return;
    }

    if (password !== confirmPassword) {
      setError("პაროლები არ ემთხვევა");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError("რეგისტრაცია ვერ მოხერხდა. სცადეთ თავიდან.");
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: tenantError } = await supabase.from("tenants").insert({
        owner_id: data.user.id,
        business_name: businessName,
        trial_ends_at: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        subscription_plan: "starter",
        subscription_status: "trial",
      });

      if (tenantError) {
        setError("ანგარიშის შექმნა ვერ მოხერხდა. სცადეთ თავიდან.");
        setLoading(false);
        return;
      }
    }

    router.push("/step-1");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <Logo />
      </div>

      <h1 className="text-center text-2xl font-bold text-on-surface">
        რეგისტრაცია
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="businessName">ბიზნესის სახელი</Label>
          <Input
            id="businessName"
            type="text"
            placeholder="თქვენი ბიზნესის სახელი"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">ელ-ფოსტა</Label>
          <Input
            id="email"
            type="email"
            placeholder="info@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">პაროლი</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="მინიმუმ 8 სიმბოლო"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">პაროლის დადასტურება</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="გაიმეორეთ პაროლი"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          რეგისტრაცია
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        უკვე გაქვთ ანგარიში?{" "}
        <Link
          href="/login"
          className="text-primary hover:underline underline-offset-4"
        >
          შესვლა
        </Link>
      </p>
    </div>
  );
}
