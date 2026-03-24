import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import MarketingLayout from "./(marketing)/marketing-layout";
import MarketingPage from "./(marketing)/marketing-page";

export default async function RootPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard/overview");
  }

  return (
    <MarketingLayout>
      <MarketingPage />
    </MarketingLayout>
  );
}
