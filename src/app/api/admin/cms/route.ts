import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  let body: {
    title: string;
    slug: string;
    content: unknown[];
    meta_title?: string | null;
    meta_description?: string | null;
    status?: string;
    published_at?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.title?.trim() || !body.slug?.trim()) {
    return NextResponse.json(
      { error: "title and slug are required" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("cms_pages")
    .insert({
      title: body.title.trim(),
      slug: body.slug.trim(),
      content: body.content ?? [],
      meta_title: body.meta_title ?? null,
      meta_description: body.meta_description ?? null,
      status: body.status ?? "draft",
      published_at: body.published_at ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
