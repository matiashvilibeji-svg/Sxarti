import { Zap } from "lucide-react";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Zap className="h-5 w-5 text-primary" />
      <span className="text-xl font-bold text-primary">სხარტი</span>
    </div>
  );
}
