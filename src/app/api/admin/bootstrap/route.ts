import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/bootstrap
 * One-time admin bootstrap: inserts the current authenticated user into admin_users
 * as super_admin. Uses service role to bypass RLS. Remove this route after setup.
 */
export async function POST() {
  // Use regular client for auth (reads session cookies)
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Use service role client for DB operations (bypasses RLS)
  const adminClient = createAdminClient();

  // Check if this user is already an admin
  const { data: selfAdmin } = await adminClient
    .from("admin_users")
    .select("id, role, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (selfAdmin) {
    if (!selfAdmin.is_active) {
      await adminClient
        .from("admin_users")
        .update({ is_active: true })
        .eq("id", selfAdmin.id);
      return NextResponse.json({
        message: "Admin account reactivated",
        user_id: user.id,
        email: user.email,
      });
    }
    return NextResponse.json({
      message: "Already an admin",
      user_id: user.id,
      email: user.email,
      role: selfAdmin.role,
    });
  }

  // Insert current user as super_admin
  const displayName = user.email?.split("@")[0] || "Admin";
  const { data: newAdmin, error: insertError } = await adminClient
    .from("admin_users")
    .insert({
      user_id: user.id,
      role: "super_admin",
      display_name: displayName,
      is_active: true,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to create admin", details: insertError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: "Admin account created successfully",
    admin: newAdmin,
    email: user.email,
  });
}
