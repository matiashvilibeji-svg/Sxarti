import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!tenant) {
    return NextResponse.json(
      { error: "no_tenant", message: "ტენანტი ვერ მოიძებნა" },
      { status: 400 },
    );
  }

  const { error: updateError } = await supabase
    .from("tenants")
    .update({
      facebook_page_id: null,
      facebook_access_token: null,
    })
    .eq("id", tenant.id);

  if (updateError) {
    return NextResponse.json(
      { error: "db_error", message: "გათიშვა ვერ მოხერხდა" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
