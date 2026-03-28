import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Bundle,
  BundleItem,
  BundleWithItems,
  Product,
} from "@/types/database";

/**
 * Fetch all active bundles for a tenant, with their items and product details.
 * Used by the bot pipeline to inject bundle info into the system prompt.
 */
export async function fetchBundlesWithItems(
  tenantId: string,
): Promise<BundleWithItems[]> {
  const supabase = createAdminClient();

  const { data: bundles } = await supabase
    .from("bundles")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (!bundles || bundles.length === 0) return [];

  const bundleIds = bundles.map((b: Bundle) => b.id);

  const { data: items } = await supabase
    .from("bundle_items")
    .select("*")
    .in("bundle_id", bundleIds);

  if (!items || items.length === 0) {
    return bundles.map((b: Bundle) => ({ ...b, items: [] }));
  }

  const productIds = Array.from(
    new Set(items.map((i: BundleItem) => i.product_id)),
  );

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .in("id", productIds);

  const productMap = new Map((products ?? []).map((p: Product) => [p.id, p]));

  return bundles.map((b: Bundle) => ({
    ...b,
    items: items
      .filter((i: BundleItem) => i.bundle_id === b.id)
      .map((i: BundleItem) => ({
        ...i,
        product: productMap.get(i.product_id)!,
      }))
      .filter((i: BundleItem & { product: Product }) => i.product),
  }));
}

/**
 * Calculate the total original price and discounted price for a bundle.
 */
export function calculateBundlePrice(bundle: BundleWithItems): {
  originalPrice: number;
  bundlePrice: number;
  savings: number;
} {
  const originalPrice = bundle.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  let bundlePrice: number;
  if (bundle.discount_type === "fixed") {
    bundlePrice = Math.max(0, originalPrice - bundle.discount_value);
  } else {
    bundlePrice = originalPrice * (1 - bundle.discount_value / 100);
  }

  return {
    originalPrice,
    bundlePrice: Math.round(bundlePrice * 100) / 100,
    savings: Math.round((originalPrice - bundlePrice) * 100) / 100,
  };
}
