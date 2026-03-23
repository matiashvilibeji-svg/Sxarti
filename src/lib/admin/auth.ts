import { createClient } from "@/lib/supabase/server";
import { AdminUser } from "@/types/admin";

export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  return data;
}

export function canManage(role: AdminUser["role"]): boolean {
  return role === "super_admin" || role === "admin";
}

export function canSupport(role: AdminUser["role"]): boolean {
  return role !== "viewer";
}
