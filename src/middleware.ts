import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { user, supabase, supabaseResponse } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Unauthenticated users trying to access protected routes
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

  // Authenticated users trying to access auth pages
  if (
    user &&
    (pathname.startsWith("/login") || pathname.startsWith("/signup"))
  ) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard/overview";
    return NextResponse.redirect(dashboardUrl);
  }

  // Admin route protection: check admin_users table
  if (user && pathname.startsWith("/admin")) {
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("id, role, is_active")
      .eq("user_id", user.id)
      .single();

    if (!adminUser || !adminUser.is_active) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard/overview";
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Onboarding check: redirect to step-1 if tenant setup is incomplete
  if (user && pathname.startsWith("/dashboard")) {
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, business_name")
      .eq("owner_id", user.id)
      .single();

    // Only redirect if we got a valid response confirming no tenant exists
    // Don't redirect on query errors (e.g. network issues)
    if (!tenantError && (!tenant || !tenant.business_name)) {
      const onboardingUrl = request.nextUrl.clone();
      onboardingUrl.pathname = "/step-1";
      return NextResponse.redirect(onboardingUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
