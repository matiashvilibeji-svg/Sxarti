/**
 * Georgian timezone (UTC+4) utilities.
 * Georgia does not observe DST (since 2005), so UTC+4 is constant year-round.
 */

const GEORGIA_OFFSET_MS = 4 * 60 * 60 * 1000;

/**
 * Convert a UTC timestamp to a Georgian date key (YYYY-MM-DD).
 * A conversation at 2026-03-24T22:00:00Z → Georgian time 2026-03-25T02:00 → "2026-03-25"
 */
export function toGeorgianDateKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const georgian = new Date(d.getTime() + GEORGIA_OFFSET_MS);
  return georgian.toISOString().split("T")[0];
}

/**
 * Get the start of "today" in Georgian timezone, returned as a UTC ISO string.
 * At 02:00 Georgian time on March 25 → returns "2026-03-24T20:00:00.000Z"
 * (midnight Georgian = 20:00 UTC previous calendar day)
 */
export function georgianTodayStartUTC(): string {
  const dateKey = toGeorgianDateKey(new Date());
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(
    Date.UTC(year, month - 1, day) - GEORGIA_OFFSET_MS,
  ).toISOString();
}

/**
 * Get the start of the current month in Georgian timezone, returned as a UTC ISO string.
 */
export function georgianMonthStartUTC(): string {
  const now = new Date();
  const georgian = new Date(now.getTime() + GEORGIA_OFFSET_MS);
  const year = georgian.getUTCFullYear();
  const month = georgian.getUTCMonth();
  return new Date(Date.UTC(year, month, 1) - GEORGIA_OFFSET_MS).toISOString();
}
