import type { DateRange, FinancialYear } from "./types";

/**
 * Indian financial year helpers.
 *
 * The year runs 1 April to 31 March and is written "2025-26", meaning 1 April
 * 2025 to 31 March 2026. Getting this boundary wrong silently files a March
 * transaction in the wrong year, so every period calculation goes through here
 * rather than being open-coded per report.
 */

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTH_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** The financial year containing an ISO date. */
export function financialYearFor(isoDate: string): FinancialYear {
  const [year, month] = isoDate.split("-").map(Number);
  // January to March belong to the year that began the previous April.
  const startYear = month >= 4 ? year : year - 1;
  return financialYearFromStart(startYear);
}

export function financialYearFromStart(startYear: number): FinancialYear {
  return {
    label: `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`,
    startDate: `${startYear}-04-01`,
    endDate: `${startYear + 1}-03-31`,
  };
}

/** Parses a "2025-26" label back into its start year. */
export function startYearOf(label: string): number {
  const startYear = Number(label.split("-")[0]);
  if (!Number.isInteger(startYear)) {
    throw new Error(`"${label}" is not a financial year label like "2025-26".`);
  }
  return startYear;
}

export function financialYearRange(label: string): DateRange {
  const { startDate, endDate } = financialYearFromStart(startYearOf(label));
  return { from: startDate, to: endDate };
}

/** Recent financial years, newest first, for a year picker. */
export function recentFinancialYears(count = 5, today = new Date()): FinancialYear[] {
  const current = financialYearFor(today.toISOString().slice(0, 10));
  const currentStart = startYearOf(current.label);
  return Array.from({ length: count }, (_, index) =>
    financialYearFromStart(currentStart - index)
  );
}

/** Inclusive day count between two ISO dates. */
export function daysBetween(from: string, to: string): number {
  const start = Date.parse(from);
  const end = Date.parse(to);
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1;
}

/**
 * Days of a financial year that have actually elapsed.
 *
 * Annualising a ratio over a year that is only half over would overstate every
 * turnover figure, so reports use elapsed days rather than a flat 365.
 */
export function elapsedDaysInRange(range: DateRange, today = new Date()): number {
  const todayIso = today.toISOString().slice(0, 10);
  const end = todayIso < range.to ? todayIso : range.to;
  if (end < range.from) return 0;
  return daysBetween(range.from, end);
}

/** Calendar month range, e.g. "2025-09" to 1–30 September 2025. */
export function monthRange(monthKey: string): DateRange {
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    from: `${monthKey}-01`,
    to: `${monthKey}-${String(lastDay).padStart(2, "0")}`,
  };
}

/** Every month in a financial year, in filing order (April first). */
export function monthsInFinancialYear(label: string): string[] {
  const startYear = startYearOf(label);
  return Array.from({ length: 12 }, (_, index) => {
    const monthIndex = 3 + index; // April is index 3.
    const year = startYear + Math.floor(monthIndex / 12);
    const month = (monthIndex % 12) + 1;
    return `${year}-${String(month).padStart(2, "0")}`;
  });
}

/** GST quarter containing a month, as used for quarterly GSTR-1. */
export function quarterOf(monthKey: string): { label: string; range: DateRange } {
  const [year, month] = monthKey.split("-").map(Number);
  const quarterIndex = Math.floor((month - 1) / 3);
  const firstMonth = quarterIndex * 3 + 1;
  const lastMonth = firstMonth + 2;
  const lastDay = new Date(Date.UTC(year, lastMonth, 0)).getUTCDate();

  return {
    label: `Q${quarterIndex + 1} ${year}`,
    range: {
      from: `${year}-${String(firstMonth).padStart(2, "0")}-01`,
      to: `${year}-${String(lastMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
    },
  };
}

/** "2025-09-15" becomes "15 Sep 2025". */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return `${day} ${MONTH_SHORT[month - 1]} ${year}`;
}

/** "2025-09" becomes "September 2025". */
export function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return monthKey;
  return `${MONTH_LONG[month - 1]} ${year}`;
}

/** "2025-09" becomes "Sep 25", for tight chart axes. */
export function formatMonthShort(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return monthKey;
  return `${MONTH_SHORT[month - 1]} ${String(year).slice(2)}`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** True when a date sits inside a range, inclusive of both ends. */
export function isWithin(isoDate: string, range: DateRange): boolean {
  return isoDate >= range.from && isoDate <= range.to;
}
