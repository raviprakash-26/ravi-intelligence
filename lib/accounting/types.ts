import type { Paise } from "./money";

/**
 * The five fundamental account classes. Every account belongs to exactly one,
 * and the class fixes which side of the account increases its balance.
 */
export type AccountType =
  | "ASSET"
  | "LIABILITY"
  | "EQUITY"
  | "INCOME"
  | "EXPENSE";

/**
 * Finer classification that drives which statement a balance lands on and where.
 * `AccountType` alone cannot tell a fixed asset from a current one, nor a direct
 * (Trading A/c) expense from an indirect (P&L) one.
 */
export type AccountGroup =
  | "CURRENT_ASSET"
  | "FIXED_ASSET"
  | "CURRENT_LIABILITY"
  | "LONG_TERM_LIABILITY"
  | "CAPITAL"
  | "DIRECT_INCOME"
  | "INDIRECT_INCOME"
  | "DIRECT_EXPENSE"
  | "INDIRECT_EXPENSE";

export type NormalBalance = "DEBIT" | "CREDIT";

export interface Account {
  /** Stable numeric code. Sorting by code gives a conventional ledger order. */
  code: string;
  name: string;
  type: AccountType;
  group: AccountGroup;
  /**
   * A contra account sits inside a class but carries the opposite normal
   * balance — Sales Returns is an income account with a debit balance, Drawings
   * is an equity account with a debit balance. Statements subtract these from
   * their parent rather than listing them as their own line.
   */
  isContra: boolean;
  /** GST ledgers and control accounts are locked from deletion and manual edits. */
  isSystem: boolean;
  description?: string;
}

/** Which side a class of account increases on. */
export function normalBalanceOf(type: AccountType, isContra = false): NormalBalance {
  const base: NormalBalance =
    type === "ASSET" || type === "EXPENSE" ? "DEBIT" : "CREDIT";
  if (!isContra) return base;
  return base === "DEBIT" ? "CREDIT" : "DEBIT";
}

/**
 * One side of one journal entry. Exactly one of debit/credit is non-zero — an
 * entry line that is both a debit and a credit is meaningless and is rejected at
 * validation.
 */
export interface JournalLine {
  accountCode: string;
  debit: Paise;
  credit: Paise;
  /** Optional per-line note, shown in the ledger detail. */
  note?: string;
}

/**
 * The voucher that produced an entry. Retailers think in vouchers ("I made a
 * sale"), not in debits and credits; the voucher type records that intent so
 * reports like Receipts & Payments can be derived without re-deriving meaning
 * from the accounts alone.
 */
export type VoucherType =
  | "SALE"
  | "PURCHASE"
  | "SALES_RETURN"
  | "PURCHASE_RETURN"
  | "EXPENSE"
  | "RECEIPT"
  | "PAYMENT"
  | "CONTRA"
  | "JOURNAL"
  | "OPENING";

export interface JournalEntry {
  id: string;
  /** ISO date, YYYY-MM-DD. Entries are ordered by date then by id. */
  date: string;
  /** Human-readable sequential number within the period, e.g. "JV-0007". */
  voucherNo: string;
  voucherType: VoucherType;
  narration: string;
  lines: JournalLine[];
  /** Free-text reference: invoice number, bill number, cheque number. */
  reference?: string;
  /** Set when the entry carries GST. Drives the GST returns. */
  gst?: GstDetail;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* GST                                                                 */
/* ------------------------------------------------------------------ */

/** Rates notified under Indian GST. 0.25% and 3% apply to gems and bullion. */
export type GstRate = 0 | 0.25 | 3 | 5 | 12 | 18 | 28;

export const GST_RATES: GstRate[] = [0, 0.25, 3, 5, 12, 18, 28];

/**
 * Intra-state supply attracts CGST + SGST (half the rate each); inter-state
 * supply attracts IGST at the full rate. Which applies is decided by comparing
 * the supplier's state with the place of supply, never entered by hand.
 */
export type SupplyType = "INTRA_STATE" | "INTER_STATE";

export type GstDirection = "OUTWARD" | "INWARD";

export interface GstDetail {
  direction: GstDirection;
  supplyType: SupplyType;
  rate: GstRate;
  /** Amount before tax. */
  taxableValue: Paise;
  cgst: Paise;
  sgst: Paise;
  igst: Paise;
  /** Cess, applicable to a few demerit goods. Kept for completeness. */
  cess: Paise;
  /** Counterparty GSTIN when registered; absent for B2C sales. */
  counterpartyGstin?: string;
  counterpartyName?: string;
  /** Two-digit state code of the place of supply. */
  placeOfSupply: string;
  /** HSN (goods) or SAC (services) code, required on B2B invoices. */
  hsnCode?: string;
  invoiceNo?: string;
  /** Purchases of capital goods and some expenses are ineligible for credit. */
  itcEligible: boolean;
  /** Reverse charge shifts the liability to the recipient. */
  reverseCharge: boolean;
}

/* ------------------------------------------------------------------ */
/* Periods                                                             */
/* ------------------------------------------------------------------ */

/**
 * An Indian financial year runs 1 April to 31 March. `label` is the conventional
 * "2025-26" form.
 */
export interface FinancialYear {
  label: string;
  startDate: string;
  endDate: string;
}

export interface DateRange {
  from: string;
  to: string;
}

/**
 * Stock is tracked periodically rather than perpetually: the retailer counts and
 * enters stock at the start and end of a period. This is how a small shop
 * actually works, and it is the basis of the textbook Trading Account.
 */
export interface PeriodAdjustments {
  /** Stock on hand at the start of the period, per the previous count. */
  openingStock: Paise;
  /** Stock on hand at period end, per the physical count. */
  closingStock: Paise;
}

/* ------------------------------------------------------------------ */
/* Ledger and reporting                                                */
/* ------------------------------------------------------------------ */

export interface LedgerMovement {
  entryId: string;
  date: string;
  voucherNo: string;
  voucherType: VoucherType;
  narration: string;
  debit: Paise;
  credit: Paise;
  /** Balance after this movement, signed in the account's normal direction. */
  runningBalance: Paise;
}

export interface LedgerAccount {
  account: Account;
  openingBalance: Paise;
  movements: LedgerMovement[];
  totalDebit: Paise;
  totalCredit: Paise;
  /** Positive means a balance on the account's normal side. */
  closingBalance: Paise;
}

export interface TrialBalanceRow {
  account: Account;
  debit: Paise;
  credit: Paise;
}

export interface TrialBalance {
  asOf: string;
  rows: TrialBalanceRow[];
  totalDebit: Paise;
  totalCredit: Paise;
  isBalanced: boolean;
}

export interface StatementLine {
  label: string;
  amount: Paise;
  /** Account code when the line maps to a single ledger account. */
  accountCode?: string;
  /** Nested detail, used for grouped presentations like "Indirect Expenses". */
  children?: StatementLine[];
  /** Rendered in bold as a subtotal or result line. */
  emphasis?: boolean;
}
