import {
  PAISE_PER_RUPEE,
  addPaise,
  multiplyPaise,
  roundToNearestRupee,
  subtractPaise,
  type Paise,
} from "./money";

/**
 * Income tax computation for a proprietor running a retail store.
 *
 * Slabs, rebates and surcharge bands are held as data keyed by financial year so
 * that a Budget change is a data edit rather than a logic rewrite. Every figure
 * is a computation aid for planning and provisioning — the filed return is the
 * taxpayer's responsibility and should be confirmed with a practitioner.
 */

export const TAX_DISCLAIMER =
  "Computed from the slabs notified for the selected financial year. This is a planning estimate to help you set aside the right amount — it is not a filed return, and it does not account for every deduction, exemption or special rate that may apply to you.";

export type TaxRegime = "NEW" | "OLD";

/** Age determines the basic exemption limit under the old regime only. */
export type AgeBand = "BELOW_60" | "SENIOR" | "SUPER_SENIOR";

interface SlabDefinition {
  /** Upper bound of the slab in rupees, or null for the top slab. */
  upTo: number | null;
  /** Marginal rate as a percentage. */
  rate: number;
}

interface SurchargeBand {
  /** Income above this level, in rupees, attracts the rate below. */
  above: number;
  rate: number;
}

interface RegimeDefinition {
  slabs: SlabDefinition[];
  /** Section 87A: full rebate up to `rebateIncomeLimit`, capped at `rebateCap`. */
  rebateIncomeLimit: number;
  rebateCap: number;
  surcharge: SurchargeBand[];
  cessRate: number;
  /** Standard deduction against salary income. Not available against business income. */
  standardDeduction: number;
}

interface YearDefinition {
  label: string;
  assessmentYear: string;
  NEW: RegimeDefinition;
  OLD: Record<AgeBand, RegimeDefinition>;
}

const SURCHARGE_NEW: SurchargeBand[] = [
  { above: 20000000, rate: 25 },
  { above: 10000000, rate: 15 },
  { above: 5000000, rate: 10 },
];

const SURCHARGE_OLD: SurchargeBand[] = [
  { above: 50000000, rate: 37 },
  { above: 20000000, rate: 25 },
  { above: 10000000, rate: 15 },
  { above: 5000000, rate: 10 },
];

function oldRegime(basicExemption: number): RegimeDefinition {
  return {
    slabs: [
      { upTo: basicExemption, rate: 0 },
      { upTo: 500000, rate: 5 },
      { upTo: 1000000, rate: 20 },
      { upTo: null, rate: 30 },
    ],
    rebateIncomeLimit: 500000,
    rebateCap: 12500,
    surcharge: SURCHARGE_OLD,
    cessRate: 4,
    standardDeduction: 50000,
  };
}

/**
 * Slab tables by financial year. Add a new entry when the Budget changes rates;
 * nothing else in this file needs to move.
 */
export const TAX_YEARS: Record<string, YearDefinition> = {
  "2025-26": {
    label: "FY 2025-26",
    assessmentYear: "AY 2026-27",
    NEW: {
      slabs: [
        { upTo: 400000, rate: 0 },
        { upTo: 800000, rate: 5 },
        { upTo: 1200000, rate: 10 },
        { upTo: 1600000, rate: 15 },
        { upTo: 2000000, rate: 20 },
        { upTo: 2400000, rate: 25 },
        { upTo: null, rate: 30 },
      ],
      rebateIncomeLimit: 1200000,
      rebateCap: 60000,
      surcharge: SURCHARGE_NEW,
      cessRate: 4,
      standardDeduction: 75000,
    },
    OLD: {
      BELOW_60: oldRegime(250000),
      SENIOR: oldRegime(300000),
      SUPER_SENIOR: oldRegime(500000),
    },
  },
};

export const DEFAULT_TAX_YEAR = "2025-26";

export function availableTaxYears(): string[] {
  return Object.keys(TAX_YEARS);
}

/* ------------------------------------------------------------------ */
/* Slab computation                                                    */
/* ------------------------------------------------------------------ */

export interface SlabRow {
  from: Paise;
  to: Paise | null;
  rate: number;
  incomeInSlab: Paise;
  tax: Paise;
}

export interface TaxComputation {
  financialYear: string;
  assessmentYear: string;
  regime: TaxRegime;
  taxableIncome: Paise;
  slabs: SlabRow[];
  taxOnIncome: Paise;
  rebate87A: Paise;
  taxAfterRebate: Paise;
  surcharge: Paise;
  surchargeRate: number;
  marginalRelief: Paise;
  cess: Paise;
  cessRate: number;
  totalTax: Paise;
  /** Total tax as a share of taxable income. */
  effectiveRate: number;
  disclaimer: string;
}

function resolveRegime(
  financialYear: string,
  regime: TaxRegime,
  ageBand: AgeBand
): RegimeDefinition {
  const year = TAX_YEARS[financialYear];
  if (!year) {
    throw new Error(
      `No tax slabs configured for ${financialYear}. Available: ${availableTaxYears().join(", ")}`
    );
  }
  return regime === "NEW" ? year.NEW : year.OLD[ageBand];
}

/** Applies the slab table to an income, returning the per-slab breakdown. */
function applySlabs(taxableIncome: Paise, slabs: SlabDefinition[]): SlabRow[] {
  const rows: SlabRow[] = [];
  let lowerBound = 0;

  for (const slab of slabs) {
    const upperBound =
      slab.upTo === null ? null : slab.upTo * PAISE_PER_RUPEE;
    const ceiling = upperBound === null ? taxableIncome : Math.min(taxableIncome, upperBound);
    const incomeInSlab = Math.max(0, ceiling - lowerBound);

    rows.push({
      from: lowerBound,
      to: upperBound,
      rate: slab.rate,
      incomeInSlab,
      tax: multiplyPaise(incomeInSlab, slab.rate / 100),
    });

    if (upperBound === null || taxableIncome <= upperBound) break;
    lowerBound = upperBound;
  }

  return rows;
}

function surchargeRateFor(
  taxableIncome: Paise,
  bands: SurchargeBand[]
): number {
  for (const band of bands) {
    if (taxableIncome > band.above * PAISE_PER_RUPEE) return band.rate;
  }
  return 0;
}

/** Tax before surcharge at a given income — the base for marginal relief. */
function taxBeforeSurcharge(
  income: Paise,
  definition: RegimeDefinition
): Paise {
  const rows = applySlabs(income, definition.slabs);
  const gross = rows.reduce((total, row) => total + row.tax, 0);
  const rebate =
    income <= definition.rebateIncomeLimit * PAISE_PER_RUPEE
      ? Math.min(gross, definition.rebateCap * PAISE_PER_RUPEE)
      : 0;
  return Math.max(0, gross - rebate);
}

/**
 * Computes income tax including rebate, surcharge with marginal relief, and cess.
 *
 * Marginal relief matters more than its obscurity suggests: without it, earning
 * one rupee over ₹50,00,000 would add tens of thousands in surcharge. The relief
 * caps the extra tax at the extra income, and it is applied at both the
 * surcharge thresholds and the Section 87A rebate limit.
 */
export function computeIncomeTax(options: {
  taxableIncome: Paise;
  regime?: TaxRegime;
  financialYear?: string;
  ageBand?: AgeBand;
}): TaxComputation {
  const {
    taxableIncome,
    regime = "NEW",
    financialYear = DEFAULT_TAX_YEAR,
    ageBand = "BELOW_60",
  } = options;

  const year = TAX_YEARS[financialYear];
  const definition = resolveRegime(financialYear, regime, ageBand);
  const income = Math.max(0, roundToNearestRupee(taxableIncome));

  const slabs = applySlabs(income, definition.slabs);
  const taxOnIncome = slabs.reduce((total, row) => total + row.tax, 0);

  // Section 87A rebate, with marginal relief just above the limit so that a
  // small increase in income cannot cost more in tax than the increase itself.
  const rebateLimit = definition.rebateIncomeLimit * PAISE_PER_RUPEE;
  let rebate87A = 0;
  if (income <= rebateLimit) {
    rebate87A = Math.min(taxOnIncome, definition.rebateCap * PAISE_PER_RUPEE);
  } else {
    const excessOverLimit = income - rebateLimit;
    const taxAtLimit = taxBeforeSurcharge(rebateLimit, definition);
    const cappedTax = addPaise(taxAtLimit, excessOverLimit);
    if (taxOnIncome > cappedTax) {
      rebate87A = subtractPaise(taxOnIncome, cappedTax);
    }
  }

  const taxAfterRebate = Math.max(0, subtractPaise(taxOnIncome, rebate87A));

  const surchargeRate = surchargeRateFor(income, definition.surcharge);
  let surcharge = multiplyPaise(taxAfterRebate, surchargeRate / 100);
  let marginalRelief = 0;

  if (surchargeRate > 0) {
    const band = definition.surcharge.find(
      (candidate) => income > candidate.above * PAISE_PER_RUPEE
    );
    if (band) {
      const threshold = band.above * PAISE_PER_RUPEE;
      const taxAtThreshold = taxBeforeSurcharge(threshold, definition);
      const excessIncome = subtractPaise(income, threshold);
      const maximumTax = addPaise(taxAtThreshold, excessIncome);
      const taxWithSurcharge = addPaise(taxAfterRebate, surcharge);
      if (taxWithSurcharge > maximumTax) {
        marginalRelief = subtractPaise(taxWithSurcharge, maximumTax);
        surcharge = Math.max(0, subtractPaise(surcharge, marginalRelief));
      }
    }
  }

  const cess = multiplyPaise(
    addPaise(taxAfterRebate, surcharge),
    definition.cessRate / 100
  );
  const totalTax = roundToNearestRupee(
    addPaise(taxAfterRebate, surcharge, cess)
  );

  return {
    financialYear,
    assessmentYear: year.assessmentYear,
    regime,
    taxableIncome: income,
    slabs,
    taxOnIncome,
    rebate87A,
    taxAfterRebate,
    surcharge,
    surchargeRate,
    marginalRelief,
    cess,
    cessRate: definition.cessRate,
    totalTax,
    effectiveRate: income === 0 ? 0 : (totalTax / income) * 100,
    disclaimer: TAX_DISCLAIMER,
  };
}

/** Runs both regimes and reports which one costs less. */
export function compareRegimes(options: {
  taxableIncome: Paise;
  financialYear?: string;
  ageBand?: AgeBand;
}): {
  newRegime: TaxComputation;
  oldRegime: TaxComputation;
  cheaper: TaxRegime;
  saving: Paise;
} {
  const newRegime = computeIncomeTax({ ...options, regime: "NEW" });
  const oldRegime = computeIncomeTax({ ...options, regime: "OLD" });
  const cheaper: TaxRegime =
    newRegime.totalTax <= oldRegime.totalTax ? "NEW" : "OLD";

  return {
    newRegime,
    oldRegime,
    cheaper,
    saving: Math.abs(subtractPaise(newRegime.totalTax, oldRegime.totalTax)),
  };
}

/* ------------------------------------------------------------------ */
/* Presumptive taxation — Section 44AD                                 */
/* ------------------------------------------------------------------ */

export interface PresumptiveResult {
  eligible: boolean;
  reason?: string;
  turnover: Paise;
  digitalTurnover: Paise;
  cashTurnover: Paise;
  /** 6% of digitally received turnover. */
  deemedProfitDigital: Paise;
  /** 8% of turnover received in cash. */
  deemedProfitCash: Paise;
  deemedProfit: Paise;
  /** Profit actually earned, for comparison against the deemed figure. */
  actualProfit?: Paise;
  turnoverLimit: Paise;
}

/**
 * Section 44AD presumptive scheme for small businesses.
 *
 * Profit is deemed to be 8% of turnover, or 6% on the part received through
 * banking channels — a real incentive to take digital payments. The turnover
 * limit is ₹3 crore where cash receipts are 5% or less of the total, and
 * ₹2 crore otherwise.
 *
 * Where actual profit is lower than the deemed figure, declaring the actual
 * profit requires an audit under Section 44AB, so the comparison is surfaced
 * rather than decided automatically.
 */
export function computePresumptiveIncome(options: {
  turnover: Paise;
  digitalTurnover: Paise;
  actualProfit?: Paise;
}): PresumptiveResult {
  const { turnover, digitalTurnover, actualProfit } = options;
  const cashTurnover = Math.max(0, subtractPaise(turnover, digitalTurnover));

  const cashShare = turnover === 0 ? 0 : (cashTurnover / turnover) * 100;
  const turnoverLimit =
    cashShare <= 5 ? 30000000 * PAISE_PER_RUPEE : 20000000 * PAISE_PER_RUPEE;

  const deemedProfitDigital = multiplyPaise(digitalTurnover, 0.06);
  const deemedProfitCash = multiplyPaise(cashTurnover, 0.08);

  const eligible = turnover <= turnoverLimit;

  return {
    eligible,
    reason: eligible
      ? undefined
      : `Turnover exceeds the ₹${
          turnoverLimit / PAISE_PER_RUPEE / 10000000
        } crore limit that applies when ${
          cashShare <= 5 ? "cash receipts are 5% or less" : "cash receipts exceed 5%"
        } of total receipts.`,
    turnover,
    digitalTurnover,
    cashTurnover,
    deemedProfitDigital,
    deemedProfitCash,
    deemedProfit: addPaise(deemedProfitDigital, deemedProfitCash),
    actualProfit,
    turnoverLimit,
  };
}

/* ------------------------------------------------------------------ */
/* Advance tax                                                         */
/* ------------------------------------------------------------------ */

export interface AdvanceTaxInstalment {
  dueDate: string;
  /** Cumulative percentage of the year's liability due by this date. */
  cumulativePercent: number;
  cumulativeAmount: Paise;
  instalmentAmount: Paise;
}

/**
 * The four advance tax instalments.
 *
 * Advance tax is due once the year's liability crosses ₹10,000; missing an
 * instalment attracts interest under Sections 234B and 234C, so the schedule is
 * shown as soon as the estimate crosses the threshold.
 */
export function buildAdvanceTaxSchedule(
  totalTax: Paise,
  financialYearStart: number
): { required: boolean; threshold: Paise; instalments: AdvanceTaxInstalment[] } {
  const threshold = 10000 * PAISE_PER_RUPEE;
  const schedule: Array<{ dueDate: string; percent: number }> = [
    { dueDate: `${financialYearStart}-06-15`, percent: 15 },
    { dueDate: `${financialYearStart}-09-15`, percent: 45 },
    { dueDate: `${financialYearStart}-12-15`, percent: 75 },
    { dueDate: `${financialYearStart + 1}-03-15`, percent: 100 },
  ];

  let previous: Paise = 0;
  const instalments = schedule.map(({ dueDate, percent }) => {
    const cumulativeAmount = roundToNearestRupee(
      multiplyPaise(totalTax, percent / 100)
    );
    const instalmentAmount = subtractPaise(cumulativeAmount, previous);
    previous = cumulativeAmount;
    return {
      dueDate,
      cumulativePercent: percent,
      cumulativeAmount,
      instalmentAmount,
    };
  });

  return { required: totalTax >= threshold, threshold, instalments };
}
