// Branded type for a validated Turkey-day date string (Plan 010 R3). A plain
// `string` cannot be passed where `TurkeyDate` is expected without going
// through `parseTurkeyDate` first, so a malformed or UTC-day date can never
// reach a repository or service boundary by accident.

declare const turkeyDateBrand: unique symbol;

export type TurkeyDate = string & { readonly [turkeyDateBrand]: true };

const TURKEY_DATE_FORMAT = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses a `YYYY-MM-DD` string into a `TurkeyDate`. Returns `null` instead of
 * throwing so route handlers can turn a rejection into a 400 response rather
 * than an unhandled exception (never throw on user input at a route
 * boundary). Rejects both malformed strings and calendar-impossible dates
 * (e.g. 2026-02-30), which `Date.parse` silently rolls over to March.
 */
export function parseTurkeyDate(value: string): TurkeyDate | null {
  const match = TURKEY_DATE_FORMAT.exec(value);
  if (!match) return null;

  const [, yearStr, monthStr, dayStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const asDate = new Date(Date.UTC(year, month - 1, day));
  const isRealCalendarDate =
    asDate.getUTCFullYear() === year && asDate.getUTCMonth() === month - 1 && asDate.getUTCDate() === day;

  return isRealCalendarDate ? (value as TurkeyDate) : null;
}
