import { createAdminClient } from "@/lib/supabase/admin";
import { PageList } from "@/components/admin/cms/page-list";
import type { CmsPage } from "@/types/admin";

export const dynamic = "force-dynamic";

export default async function CmsListPage() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("cms_pages")
    .select("*")
    .order("updated_at", { ascending: false });

  const pages: CmsPage[] = error ? [] : (data as CmsPage[]);

  return <PageList pages={pages} />;
}
