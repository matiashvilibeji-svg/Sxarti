import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { user, supabase, supabaseResponse } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Public routes — no auth checks needed
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup")
  ) {
    // Redirect authenticated users away from auth pages
    if (
      user &&
      (pathname.startsWith("/login") || pathname.startsWith("/signup"))
    ) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard/overview";
      return NextResponse.redirect(dashboardUrl);
    }
    return supabaseResponse;
  }

  // Protected routes — require auth
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/step-") ||
    pathname === "/complete";

  if (!user && isProtectedRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // If not authenticated and not protected, just pass through
  if (!user) {
    return supabaseResponse;
  }

  // Admin route protection: check admin_users table (only for /admin routes)
  if (pathname.startsWith("/admin")) {
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!adminUser) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard/overview";
      return NextResponse.redirect(dashboardUrl);
    }
    // Admin routes don't need tenant check — return early
    return supabaseResponse;
  }

  // Onboarding check: only for /dashboard routes, skip for /step- and /complete
  if (pathname.startsWith("/dashboard")) {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!tenant) {
      const onboardingUrl = request.nextUrl.clone();
      onboardingUrl.pathname = "/step-1";
      return NextResponse.redirect(onboardingUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
