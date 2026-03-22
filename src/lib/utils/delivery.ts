import type { DeliveryZone } from "@/types/database";

export function calculateDeliveryFee(
  zones: DeliveryZone[],
  zoneId: string,
): number {
  const zone = zones.find((z) => z.id === zoneId);
  if (!zone) return 0;
  return Number(zone.fee);
}

export function getActiveZones(zones: DeliveryZone[]): DeliveryZone[] {
  return zones.filter((z) => z.is_active);
}
