import { createAdminClient } from "@/lib/supabase/admin";
import { BlockEditor } from "@/components/admin/cms/block-editor";
import type { CmsPage } from "@/types/admin";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CmsEditorPage({ params }: Props) {
  const { slug } = await params;

  if (slug === "new") {
    return <BlockEditor page={null} isNew />;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("cms_pages")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-on-surface-variant">Page not found.</p>
      </div>
    );
  }

  return <BlockEditor page={data as CmsPage} isNew={false} />;
}
