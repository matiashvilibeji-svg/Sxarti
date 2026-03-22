import { Logo } from "@/components/shared/logo";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-surface">
      <div className="flex h-16 items-center">
        <Logo />
      </div>

      {/* Progress indicator placeholder */}
      <div className="mb-8 h-1 w-full max-w-2xl rounded-full bg-surface-container-high" />

      <div className="w-full max-w-2xl px-4">{children}</div>
    </div>
  );
}
