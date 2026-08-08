import {
  addPaise,
  allocatePaise,
  multiplyPaise,
  roundHalfAwayFromZero,
  subtractPaise,
  type Paise,
} from "./money";
import type {
  GstDetail,
  GstRate,
  JournalEntry,
  SupplyType,
} from "./types";

/* ------------------------------------------------------------------ */
/* State codes                                                         */
/* ------------------------------------------------------------------ */

/**
 * GST state codes as notified. The first two digits of a GSTIN are the state
 * code, and comparing the supplier's code with the place of supply is what
 * decides CGST+SGST versus IGST.
 */
export const GST_STATE_CODES: Record<string, string> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
  "97": "Other Territory",
};

export function stateNameForCode(code: string): string | undefined {
  return GST_STATE_CODES[code];
}

/* ------------------------------------------------------------------ */
/* GSTIN validation                                                    */
/* ------------------------------------------------------------------ */

const GSTIN_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export interface GstinValidation {
  valid: boolean;
  reason?: string;
  stateCode?: string;
  stateName?: string;
  pan?: string;
}

/**
 * Validates a GSTIN structurally and by its check digit.
 *
 * The 15th character is a mod-36 checksum over the first 14, so a single
 * mistyped character is caught here rather than at filing time. Format alone
 * would not catch that.
 */
export function validateGstin(input: string): GstinValidation {
  const gstin = input.trim().toUpperCase();

  if (gstin.length !== 15) {
    return { valid: false, reason: "A GSTIN is exactly 15 characters." };
  }
  if (!GSTIN_PATTERN.test(gstin)) {
    return {
      valid: false,
      reason:
        "Format must be 2 digits, 5 letters, 4 digits, 1 letter, 1 alphanumeric, 'Z', then 1 check character.",
    };
  }

  const stateCode = gstin.slice(0, 2);
  if (!GST_STATE_CODES[stateCode]) {
    return { valid: false, reason: `"${stateCode}" is not a valid state code.` };
  }

  if (computeGstinCheckDigit(gstin.slice(0, 14)) !== gstin[14]) {
    return { valid: false, reason: "Check digit does not match — please re-check the GSTIN." };
  }

  return {
    valid: true,
    stateCode,
    stateName: GST_STATE_CODES[stateCode],
    pan: gstin.slice(2, 12),
  };
}

/** Mod-36 checksum over the first 14 characters of a GSTIN. */
export function computeGstinCheckDigit(first14: string): string {
  let sum = 0;
  for (let index = 0; index < first14.length; index += 1) {
    const value = GSTIN_CHARSET.indexOf(first14[index]);
    if (value < 0) return "";
    // Weights alternate 1, 2, 1, 2 … starting at 1.
    const weight = (index % 2) + 1;
    const product = value * weight;
    sum += Math.floor(product / 36) + (product % 36);
  }
  return GSTIN_CHARSET[(36 - (sum % 36)) % 36];
}

export function isValidPan(input: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(input.trim().toUpperCase());
}

/* ------------------------------------------------------------------ */
/* Tax computation                                                     */
/* ------------------------------------------------------------------ */

export interface TaxSplit {
  taxableValue: Paise;
  cgst: Paise;
  sgst: Paise;
  igst: Paise;
  cess: Paise;
  total: Paise;
}

export function supplyTypeFor(
  supplierStateCode: string,
  placeOfSupplyCode: string
): SupplyType {
  return supplierStateCode === placeOfSupplyCode ? "INTRA_STATE" : "INTER_STATE";
}

/**
 * Splits tax on a taxable value.
 *
 * For an intra-state supply the total tax is halved into CGST and SGST using a
 * remainder-preserving allocation, so the two halves always add back to the
 * total tax exactly — a 5% tax on ₹100.01 is 500.05 paise, and naive halving
 * would silently drop a paise.
 */
export function computeTaxOnTaxableValue(
  taxableValue: Paise,
  rate: GstRate,
  supplyType: SupplyType,
  cessRate = 0
): TaxSplit {
  const totalTax = multiplyPaise(taxableValue, rate / 100);
  const cess = cessRate > 0 ? multiplyPaise(taxableValue, cessRate / 100) : 0;

  if (supplyType === "INTER_STATE") {
    return {
      taxableValue,
      cgst: 0,
      sgst: 0,
      igst: totalTax,
      cess,
      total: addPaise(taxableValue, totalTax, cess),
    };
  }

  const [cgst, sgst] = allocatePaise(totalTax, [1, 1]);
  return {
    taxableValue,
    cgst,
    sgst,
    igst: 0,
    cess,
    total: addPaise(taxableValue, cgst, sgst, cess),
  };
}

/**
 * Back-calculates the taxable value from a tax-inclusive amount (an MRP-style
 * counter price) and splits the tax out of it.
 *
 * taxable = inclusive × 100 / (100 + rate). The tax is then derived as the
 * remainder rather than recomputed from the rate, which guarantees taxable + tax
 * equals the inclusive amount the customer actually paid.
 */
export function computeTaxOnInclusiveAmount(
  inclusiveAmount: Paise,
  rate: GstRate,
  supplyType: SupplyType
): TaxSplit {
  const taxableValue = roundHalfAwayFromZero(
    (inclusiveAmount * 100) / (100 + rate)
  );
  const totalTax = subtractPaise(inclusiveAmount, taxableValue);

  if (supplyType === "INTER_STATE") {
    return {
      taxableValue,
      cgst: 0,
      sgst: 0,
      igst: totalTax,
      cess: 0,
      total: inclusiveAmount,
    };
  }

  const [cgst, sgst] = allocatePaise(totalTax, [1, 1]);
  return {
    taxableValue,
    cgst,
    sgst,
    igst: 0,
    cess: 0,
    total: inclusiveAmount,
  };
}

/* ------------------------------------------------------------------ */
/* Input tax credit set-off                                            */
/* ------------------------------------------------------------------ */

export interface TaxPot {
  igst: Paise;
  cgst: Paise;
  sgst: Paise;
}

export interface ItcSetOff {
  /** Liability before any credit is applied. */
  liability: TaxPot;
  /** Credit available before set-off. */
  creditAvailable: TaxPot;
  /** How each credit head was consumed, keyed by credit head then liability head. */
  utilisation: {
    igstCredit: { againstIgst: Paise; againstCgst: Paise; againstSgst: Paise };
    cgstCredit: { againstCgst: Paise; againstIgst: Paise };
    sgstCredit: { againstSgst: Paise; againstIgst: Paise };
  };
  /** Tax that must still be paid in cash after set-off. */
  cashPayable: TaxPot;
  /** Unused credit carried forward to the next period. */
  creditCarriedForward: TaxPot;
  totalCashPayable: Paise;
}

/**
 * Applies input tax credit against output liability in the statutory order.
 *
 * Section 49A with Rule 88A requires IGST credit to be exhausted first — against
 * IGST liability, then against CGST and SGST in any order. Only then may CGST
 * credit be used (CGST liability first, then IGST) and SGST credit likewise.
 * Crucially, CGST credit can never discharge SGST liability or the reverse;
 * those are separate exchequers.
 *
 * Getting this order wrong does not change the total tax, but it changes how
 * much must be paid in cash now versus carried forward — which is exactly the
 * number a shopkeeper cares about.
 */
export function applyItcSetOff(
  liability: TaxPot,
  creditAvailable: TaxPot
): ItcSetOff {
  const owed: TaxPot = { ...liability };
  const credit: TaxPot = { ...creditAvailable };

  const consume = (
    creditHead: keyof TaxPot,
    liabilityHead: keyof TaxPot
  ): Paise => {
    const used = Math.min(credit[creditHead], owed[liabilityHead]);
    credit[creditHead] -= used;
    owed[liabilityHead] -= used;
    return used;
  };

  // 1. IGST credit: IGST liability first, then CGST, then SGST.
  const igstAgainstIgst = consume("igst", "igst");
  const igstAgainstCgst = consume("igst", "cgst");
  const igstAgainstSgst = consume("igst", "sgst");

  // 2. CGST credit: CGST liability first, then any remaining IGST liability.
  const cgstAgainstCgst = consume("cgst", "cgst");
  const cgstAgainstIgst = consume("cgst", "igst");

  // 3. SGST credit: SGST liability first, then any remaining IGST liability.
  const sgstAgainstSgst = consume("sgst", "sgst");
  const sgstAgainstIgst = consume("sgst", "igst");

  return {
    liability: { ...liability },
    creditAvailable: { ...creditAvailable },
    utilisation: {
      igstCredit: {
        againstIgst: igstAgainstIgst,
        againstCgst: igstAgainstCgst,
        againstSgst: igstAgainstSgst,
      },
      cgstCredit: { againstCgst: cgstAgainstCgst, againstIgst: cgstAgainstIgst },
      sgstCredit: { againstSgst: sgstAgainstSgst, againstIgst: sgstAgainstIgst },
    },
    cashPayable: { ...owed },
    creditCarriedForward: { ...credit },
    totalCashPayable: addPaise(owed.igst, owed.cgst, owed.sgst),
  };
}

/* ------------------------------------------------------------------ */
/* Returns                                                             */
/* ------------------------------------------------------------------ */

export interface GstRateBucket {
  rate: GstRate;
  taxableValue: Paise;
  cgst: Paise;
  sgst: Paise;
  igst: Paise;
  cess: Paise;
  invoiceCount: number;
}

export interface Gstr3bSummary {
  period: { from: string; to: string };
  /** Table 3.1(a): outward taxable supplies other than zero-rated and exempt. */
  outwardSupplies: GstRateBucket[];
  outwardTotal: TaxPot & { taxableValue: Paise; cess: Paise };
  /** Table 4(A): input tax credit available. */
  inwardSupplies: GstRateBucket[];
  itcAvailable: TaxPot & { taxableValue: Paise; cess: Paise };
  /** Credit blocked because the purchase was flagged ineligible. */
  itcIneligible: TaxPot;
  setOff: ItcSetOff;
}

export interface Gstr1B2bInvoice {
  counterpartyGstin: string;
  counterpartyName?: string;
  invoiceNo: string;
  date: string;
  placeOfSupply: string;
  placeOfSupplyName?: string;
  rate: GstRate;
  taxableValue: Paise;
  cgst: Paise;
  sgst: Paise;
  igst: Paise;
  cess: Paise;
  invoiceValue: Paise;
}

export interface Gstr1HsnRow {
  hsnCode: string;
  rate: GstRate;
  taxableValue: Paise;
  cgst: Paise;
  sgst: Paise;
  igst: Paise;
  cess: Paise;
}

export interface Gstr1Summary {
  period: { from: string; to: string };
  /** Table 4: registered-buyer invoices, reported one line per invoice. */
  b2b: Gstr1B2bInvoice[];
  /** Tables 5 and 7: unregistered buyers, reported as rate-wise totals. */
  b2cSummary: GstRateBucket[];
  /** Table 12: rate-wise HSN summary. */
  hsnSummary: Gstr1HsnRow[];
  totals: TaxPot & { taxableValue: Paise; cess: Paise; invoiceCount: number };
}

function emptyBucketTotals() {
  return { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, cess: 0 };
}

function accumulateBuckets(
  buckets: Map<GstRate, GstRateBucket>,
  detail: GstDetail
): void {
  const existing =
    buckets.get(detail.rate) ??
    ({
      rate: detail.rate,
      ...emptyBucketTotals(),
      invoiceCount: 0,
    } as GstRateBucket);

  existing.taxableValue = addPaise(existing.taxableValue, detail.taxableValue);
  existing.cgst = addPaise(existing.cgst, detail.cgst);
  existing.sgst = addPaise(existing.sgst, detail.sgst);
  existing.igst = addPaise(existing.igst, detail.igst);
  existing.cess = addPaise(existing.cess, detail.cess);
  existing.invoiceCount += 1;

  buckets.set(detail.rate, existing);
}

function sortBuckets(buckets: Map<GstRate, GstRateBucket>): GstRateBucket[] {
  return [...buckets.values()].sort((a, b) => a.rate - b.rate);
}

/**
 * Builds the GSTR-3B monthly summary from the journal.
 *
 * Only entries carrying GST detail contribute. Purchases flagged
 * `itcEligible: false` are reported separately and excluded from the credit
 * pool, since claiming blocked credit under Section 17(5) is a common and
 * expensive error.
 */
export function buildGstr3b(
  entries: JournalEntry[],
  period: { from: string; to: string },
  openingCredit: TaxPot = { igst: 0, cgst: 0, sgst: 0 }
): Gstr3bSummary {
  const outward = new Map<GstRate, GstRateBucket>();
  const inward = new Map<GstRate, GstRateBucket>();
  const outwardTotal = { ...emptyBucketTotals() };
  const itcAvailable = { ...emptyBucketTotals() };
  const itcIneligible: TaxPot = { igst: 0, cgst: 0, sgst: 0 };

  for (const entry of entries) {
    const detail = entry.gst;
    if (!detail) continue;
    if (entry.date < period.from || entry.date > period.to) continue;

    if (detail.direction === "OUTWARD") {
      accumulateBuckets(outward, detail);
      outwardTotal.taxableValue = addPaise(
        outwardTotal.taxableValue,
        detail.taxableValue
      );
      outwardTotal.cgst = addPaise(outwardTotal.cgst, detail.cgst);
      outwardTotal.sgst = addPaise(outwardTotal.sgst, detail.sgst);
      outwardTotal.igst = addPaise(outwardTotal.igst, detail.igst);
      outwardTotal.cess = addPaise(outwardTotal.cess, detail.cess);
    } else {
      accumulateBuckets(inward, detail);
      if (detail.itcEligible) {
        itcAvailable.taxableValue = addPaise(
          itcAvailable.taxableValue,
          detail.taxableValue
        );
        itcAvailable.cgst = addPaise(itcAvailable.cgst, detail.cgst);
        itcAvailable.sgst = addPaise(itcAvailable.sgst, detail.sgst);
        itcAvailable.igst = addPaise(itcAvailable.igst, detail.igst);
        itcAvailable.cess = addPaise(itcAvailable.cess, detail.cess);
      } else {
        itcIneligible.cgst = addPaise(itcIneligible.cgst, detail.cgst);
        itcIneligible.sgst = addPaise(itcIneligible.sgst, detail.sgst);
        itcIneligible.igst = addPaise(itcIneligible.igst, detail.igst);
      }
    }
  }

  const setOff = applyItcSetOff(
    { igst: outwardTotal.igst, cgst: outwardTotal.cgst, sgst: outwardTotal.sgst },
    {
      igst: addPaise(itcAvailable.igst, openingCredit.igst),
      cgst: addPaise(itcAvailable.cgst, openingCredit.cgst),
      sgst: addPaise(itcAvailable.sgst, openingCredit.sgst),
    }
  );

  return {
    period,
    outwardSupplies: sortBuckets(outward),
    outwardTotal: {
      taxableValue: outwardTotal.taxableValue,
      cgst: outwardTotal.cgst,
      sgst: outwardTotal.sgst,
      igst: outwardTotal.igst,
      cess: outwardTotal.cess,
    },
    inwardSupplies: sortBuckets(inward),
    itcAvailable: {
      taxableValue: itcAvailable.taxableValue,
      cgst: itcAvailable.cgst,
      sgst: itcAvailable.sgst,
      igst: itcAvailable.igst,
      cess: itcAvailable.cess,
    },
    itcIneligible,
    setOff,
  };
}

/**
 * Builds the GSTR-1 outward-supply return.
 *
 * B2B supplies (buyer has a GSTIN) are reported invoice by invoice because the
 * buyer's credit depends on the detail matching. B2C supplies are reported only
 * as rate-wise totals.
 */
export function buildGstr1(
  entries: JournalEntry[],
  period: { from: string; to: string }
): Gstr1Summary {
  const b2b: Gstr1B2bInvoice[] = [];
  const b2c = new Map<GstRate, GstRateBucket>();
  const hsn = new Map<string, Gstr1HsnRow>();
  const totals = { ...emptyBucketTotals(), invoiceCount: 0 };

  for (const entry of entries) {
    const detail = entry.gst;
    if (!detail || detail.direction !== "OUTWARD") continue;
    if (entry.date < period.from || entry.date > period.to) continue;

    if (detail.counterpartyGstin) {
      b2b.push({
        counterpartyGstin: detail.counterpartyGstin,
        counterpartyName: detail.counterpartyName,
        invoiceNo: detail.invoiceNo ?? entry.voucherNo,
        date: entry.date,
        placeOfSupply: detail.placeOfSupply,
        placeOfSupplyName: stateNameForCode(detail.placeOfSupply),
        rate: detail.rate,
        taxableValue: detail.taxableValue,
        cgst: detail.cgst,
        sgst: detail.sgst,
        igst: detail.igst,
        cess: detail.cess,
        invoiceValue: addPaise(
          detail.taxableValue,
          detail.cgst,
          detail.sgst,
          detail.igst,
          detail.cess
        ),
      });
    } else {
      accumulateBuckets(b2c, detail);
    }

    if (detail.hsnCode) {
      const key = `${detail.hsnCode}|${detail.rate}`;
      const row =
        hsn.get(key) ??
        ({
          hsnCode: detail.hsnCode,
          rate: detail.rate,
          ...emptyBucketTotals(),
        } as Gstr1HsnRow);
      row.taxableValue = addPaise(row.taxableValue, detail.taxableValue);
      row.cgst = addPaise(row.cgst, detail.cgst);
      row.sgst = addPaise(row.sgst, detail.sgst);
      row.igst = addPaise(row.igst, detail.igst);
      row.cess = addPaise(row.cess, detail.cess);
      hsn.set(key, row);
    }

    totals.taxableValue = addPaise(totals.taxableValue, detail.taxableValue);
    totals.cgst = addPaise(totals.cgst, detail.cgst);
    totals.sgst = addPaise(totals.sgst, detail.sgst);
    totals.igst = addPaise(totals.igst, detail.igst);
    totals.cess = addPaise(totals.cess, detail.cess);
    totals.invoiceCount += 1;
  }

  return {
    period,
    b2b: b2b.sort((a, b) => a.date.localeCompare(b.date)),
    b2cSummary: sortBuckets(b2c),
    hsnSummary: [...hsn.values()].sort(
      (a, b) => a.hsnCode.localeCompare(b.hsnCode) || a.rate - b.rate
    ),
    totals,
  };
}
