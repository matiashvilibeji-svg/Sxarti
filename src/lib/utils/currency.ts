export function formatGEL(amount: number): string {
  return `${amount.toFixed(2)} ₾`;
}

export function parseGEL(formatted: string): number {
  return parseFloat(formatted.replace(/[^\d.]/g, ""));
}
