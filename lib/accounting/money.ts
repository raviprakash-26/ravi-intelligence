/**
 * Money arithmetic for the books.
 *
 * Every amount in the accounting engine is an integer number of paise. Floating
 * point rupees cannot represent 0.1 exactly, and in double-entry bookkeeping a
 * fraction of a paise lost on one side of an entry is a trial balance that never
 * ties. Integers make the arithmetic exact and the imbalance checks meaningful.
 */

/** An integer count of paise. 100 paise = 1 rupee. */
export type Paise = number;

export const PAISE_PER_RUPEE = 100;

/** Largest amount we accept, ~92,233 crore. Guards against overflow of Number. */
const MAX_PAISE = Number.MAX_SAFE_INTEGER;

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyError";
  }
}

function assertSafe(value: number, context: string): Paise {
  if (!Number.isFinite(value)) {
    throw new MoneyError(`${context}: amount is not a finite number`);
  }
  if (!Number.isInteger(value)) {
    throw new MoneyError(`${context}: amount ${value} is not a whole paise`);
  }
  if (Math.abs(value) > MAX_PAISE) {
    throw new MoneyError(`${context}: amount ${value} exceeds the safe range`);
  }
  return value;
}

/**
 * Parses a user-entered rupee amount into paise.
 *
 * Accepts "1234.50", "1,234.50", "₹1,234.50", " 1234 " and bare numbers. Rejects
 * anything with more than two decimal places rather than silently rounding, so a
 * typo like "100.567" surfaces at entry instead of becoming a rounding surprise
 * three reports later.
 */
export function rupeesToPaise(input: string | number): Paise {
  if (typeof input === "number") {
    if (!Number.isFinite(input)) {
      throw new MoneyError("Amount is not a finite number");
    }
    const scaled = Math.round(input * PAISE_PER_RUPEE);
    // Guard against a float that was never a clean 2-decimal rupee value.
    if (Math.abs(input * PAISE_PER_RUPEE - scaled) > 1e-6) {
      throw new MoneyError(`Amount ${input} has sub-paise precision`);
    }
    return assertSafe(scaled, "Amount");
  }

  const cleaned = input.replace(/[₹,\s]/g, "");
  if (cleaned === "" || cleaned === "-") {
    throw new MoneyError("Amount is empty");
  }
  if (!/^-?\d*(\.\d{0,2})?$/.test(cleaned)) {
    throw new MoneyError(
      `"${input}" is not a valid rupee amount (use up to 2 decimal places)`
    );
  }

  const negative = cleaned.startsWith("-");
  const unsigned = negative ? cleaned.slice(1) : cleaned;
  const [whole = "0", fraction = ""] = unsigned.split(".");
  const paise =
    Number(whole || "0") * PAISE_PER_RUPEE + Number(fraction.padEnd(2, "0") || "0");

  return assertSafe(negative ? -paise : paise, "Amount");
}

/** Converts paise back to a rupee number. For display and export only. */
export function paiseToRupees(paise: Paise): number {
  return assertSafe(paise, "Amount") / PAISE_PER_RUPEE;
}

/**
 * Formats paise using the Indian digit grouping convention (lakh and crore),
 * e.g. 12,34,567.89 rather than 1,234,567.89.
 */
export function formatPaise(
  paise: Paise,
  options: { symbol?: boolean; showZeroAsDash?: boolean } = {}
): string {
  const { symbol = true, showZeroAsDash = false } = options;
  assertSafe(paise, "Amount");

  if (paise === 0 && showZeroAsDash) return "—";

  const negative = paise < 0;
  const absolute = Math.abs(paise);
  const whole = Math.floor(absolute / PAISE_PER_RUPEE);
  const fraction = absolute % PAISE_PER_RUPEE;

  const grouped = groupIndian(whole);
  const body = `${grouped}.${String(fraction).padStart(2, "0")}`;
  const prefix = symbol ? "₹" : "";

  return negative ? `-${prefix}${body}` : `${prefix}${body}`;
}

/**
 * Groups an integer with Indian separators: the last three digits, then pairs.
 * 1234567 becomes "12,34,567".
 */
export function groupIndian(value: number): string {
  const digits = String(Math.abs(Math.trunc(value)));
  if (digits.length <= 3) return digits;

  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  const pairs = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${pairs},${last3}`;
}

export function addPaise(...amounts: Paise[]): Paise {
  return assertSafe(
    amounts.reduce((total, amount) => total + assertSafe(amount, "Amount"), 0),
    "Sum"
  );
}

export function subtractPaise(a: Paise, b: Paise): Paise {
  return assertSafe(assertSafe(a, "Amount") - assertSafe(b, "Amount"), "Difference");
}

export function negatePaise(a: Paise): Paise {
  return assertSafe(-assertSafe(a, "Amount"), "Amount");
}

/**
 * Multiplies paise by a rate (for example a GST rate or a depreciation
 * percentage) and rounds half away from zero, which is the rounding convention
 * used for tax amounts under Indian GST rules.
 */
export function multiplyPaise(amount: Paise, rate: number): Paise {
  assertSafe(amount, "Amount");
  if (!Number.isFinite(rate)) {
    throw new MoneyError("Rate is not a finite number");
  }
  return assertSafe(roundHalfAwayFromZero(amount * rate), "Product");
}

export function roundHalfAwayFromZero(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/**
 * Splits an amount into parts by weight, distributing the rounding remainder so
 * the parts always sum back to exactly the original amount.
 *
 * This matters for CGST/SGST: a 5% tax on ₹100.01 is 500.05 paise total, and
 * naive halving would give two 250-paise halves that lose a paise. The remainder
 * goes to the earliest parts, matching how tax invoices are conventionally
 * rounded.
 */
export function allocatePaise(amount: Paise, weights: number[]): Paise[] {
  assertSafe(amount, "Amount");
  if (weights.length === 0) {
    throw new MoneyError("Cannot allocate across zero parts");
  }
  if (weights.some((weight) => !Number.isFinite(weight) || weight < 0)) {
    throw new MoneyError("Allocation weights must be finite and non-negative");
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight === 0) {
    throw new MoneyError("Allocation weights sum to zero");
  }

  const sign = amount < 0 ? -1 : 1;
  const absolute = Math.abs(amount);

  const floors = weights.map((weight) =>
    Math.floor((absolute * weight) / totalWeight)
  );
  let remainder = absolute - floors.reduce((sum, part) => sum + part, 0);

  // Hand the leftover paise out one at a time, largest fractional part first, so
  // the distribution is deterministic rather than dependent on input order.
  const order = weights
    .map((weight, index) => ({
      index,
      fraction: (absolute * weight) / totalWeight - floors[index],
    }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  for (const { index } of order) {
    if (remainder <= 0) break;
    floors[index] += 1;
    remainder -= 1;
  }

  return floors.map((part) => part * sign);
}

/** Rounds paise to the nearest rupee. Used for income tax, which is filed in whole rupees. */
export function roundToNearestRupee(paise: Paise): Paise {
  assertSafe(paise, "Amount");
  return roundHalfAwayFromZero(paise / PAISE_PER_RUPEE) * PAISE_PER_RUPEE;
}

export function isZero(paise: Paise): boolean {
  return paise === 0;
}

export const ZERO: Paise = 0;
