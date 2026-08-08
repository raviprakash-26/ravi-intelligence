import { SYSTEM_ACCOUNTS } from "./chart-of-accounts";
import {
  computeTaxOnInclusiveAmount,
  computeTaxOnTaxableValue,
  supplyTypeFor,
} from "./gst";
import { addPaise, type Paise } from "./money";
import type {
  Account,
  GstDetail,
  GstRate,
  JournalEntry,
  JournalLine,
  VoucherType,
} from "./types";

export class JournalError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super(issues.join(" "));
    this.name = "JournalError";
    this.issues = issues;
  }
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  totalDebit: Paise;
  totalCredit: Paise;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Checks that an entry is a well-formed double entry.
 *
 * The debit-equals-credit rule is the one invariant the whole system rests on:
 * if it holds for every entry, the trial balance ties by construction and every
 * downstream statement is internally consistent. Nothing is written to the
 * ledger without passing here.
 */
export function validateEntry(
  lines: JournalLine[],
  accountIndex: Map<string, Account>,
  date?: string
): ValidationResult {
  const issues: string[] = [];

  if (date !== undefined && !ISO_DATE.test(date)) {
    issues.push(`Date "${date}" must be in YYYY-MM-DD form.`);
  } else if (date !== undefined && Number.isNaN(Date.parse(date))) {
    issues.push(`Date "${date}" is not a real calendar date.`);
  }

  if (lines.length < 2) {
    issues.push("An entry needs at least two lines — one debit and one credit.");
  }

  let totalDebit = 0;
  let totalCredit = 0;

  lines.forEach((line, index) => {
    const position = `Line ${index + 1}`;

    if (!accountIndex.has(line.accountCode)) {
      issues.push(`${position}: account "${line.accountCode}" does not exist.`);
    }
    if (!Number.isInteger(line.debit) || !Number.isInteger(line.credit)) {
      issues.push(`${position}: amounts must be whole paise.`);
      return;
    }
    if (line.debit < 0 || line.credit < 0) {
      issues.push(
        `${position}: amounts cannot be negative — use the other side of the entry instead.`
      );
    }
    if (line.debit > 0 && line.credit > 0) {
      issues.push(`${position}: a line is either a debit or a credit, not both.`);
    }
    if (line.debit === 0 && line.credit === 0) {
      issues.push(`${position}: amount is zero.`);
    }

    totalDebit += line.debit;
    totalCredit += line.credit;
  });

  if (totalDebit !== totalCredit) {
    const difference = Math.abs(totalDebit - totalCredit);
    issues.push(
      `Debits (${totalDebit / 100}) and credits (${totalCredit / 100}) differ by ₹${(
        difference / 100
      ).toFixed(2)}.`
    );
  }

  return { valid: issues.length === 0, issues, totalDebit, totalCredit };
}

function debit(accountCode: string, amount: Paise, note?: string): JournalLine {
  return { accountCode, debit: amount, credit: 0, note };
}

function credit(accountCode: string, amount: Paise, note?: string): JournalLine {
  return { accountCode, debit: 0, credit: amount, note };
}

/** Drops zero-value lines, which arise when a GST component is nil. */
function compact(lines: JournalLine[]): JournalLine[] {
  return lines.filter((line) => line.debit !== 0 || line.credit !== 0);
}

/* ------------------------------------------------------------------ */
/* Voucher inputs                                                      */
/* ------------------------------------------------------------------ */

export type PaymentMode = "CASH" | "BANK" | "CREDIT";

function settlementAccount(mode: PaymentMode, onCredit: string): string {
  if (mode === "CASH") return SYSTEM_ACCOUNTS.cash;
  if (mode === "BANK") return SYSTEM_ACCOUNTS.bank;
  return onCredit;
}

export interface GstInput {
  rate: GstRate;
  /** Two-digit state code where the supply is made. */
  placeOfSupply: string;
  /** True when the entered amount already includes GST (a counter/MRP price). */
  amountIsInclusive?: boolean;
  counterpartyGstin?: string;
  counterpartyName?: string;
  hsnCode?: string;
  invoiceNo?: string;
  /** Purchases only. Blocked credits under Section 17(5) must be flagged false. */
  itcEligible?: boolean;
  reverseCharge?: boolean;
}

export interface VoucherBase {
  date: string;
  /** Rupee amount in paise. Taxable value, or gross if `amountIsInclusive`. */
  amount: Paise;
  narration?: string;
  reference?: string;
}

export interface SaleVoucher extends VoucherBase {
  kind: "SALE";
  paymentMode: PaymentMode;
  gst?: GstInput;
}

export interface PurchaseVoucher extends VoucherBase {
  kind: "PURCHASE";
  paymentMode: PaymentMode;
  gst?: GstInput;
}

export interface SalesReturnVoucher extends VoucherBase {
  kind: "SALES_RETURN";
  paymentMode: PaymentMode;
  gst?: GstInput;
}

export interface PurchaseReturnVoucher extends VoucherBase {
  kind: "PURCHASE_RETURN";
  paymentMode: PaymentMode;
  gst?: GstInput;
}

export interface ExpenseVoucher extends VoucherBase {
  kind: "EXPENSE";
  /** Which expense account to charge, e.g. 6020 for Rent. */
  expenseAccount: string;
  paymentMode: PaymentMode;
  /** Where an unpaid expense is parked when `paymentMode` is CREDIT. */
  payableAccount?: string;
  gst?: GstInput;
}

export interface ReceiptVoucher extends VoucherBase {
  kind: "RECEIPT";
  /** Account being settled — usually Sundry Debtors. */
  fromAccount: string;
  into: "CASH" | "BANK";
}

export interface PaymentVoucher extends VoucherBase {
  kind: "PAYMENT";
  /** Account being settled — usually Sundry Creditors. */
  toAccount: string;
  from: "CASH" | "BANK";
}

export interface ContraVoucher extends VoucherBase {
  kind: "CONTRA";
  direction: "CASH_TO_BANK" | "BANK_TO_CASH";
}

export interface CapitalVoucher extends VoucherBase {
  kind: "CAPITAL";
  action: "INTRODUCE" | "WITHDRAW";
  through: "CASH" | "BANK";
}

export interface DepreciationVoucher extends VoucherBase {
  kind: "DEPRECIATION";
  /** Fixed asset being depreciated, recorded via accumulated depreciation. */
  assetAccount: string;
}

export interface ManualVoucher extends VoucherBase {
  kind: "JOURNAL";
  lines: JournalLine[];
}

export type Voucher =
  | SaleVoucher
  | PurchaseVoucher
  | SalesReturnVoucher
  | PurchaseReturnVoucher
  | ExpenseVoucher
  | ReceiptVoucher
  | PaymentVoucher
  | ContraVoucher
  | CapitalVoucher
  | DepreciationVoucher
  | ManualVoucher;

export interface BuildContext {
  /** The store's own state code, used to decide CGST+SGST versus IGST. */
  supplierStateCode: string;
  accountIndex: Map<string, Account>;
}

export interface BuiltEntry {
  voucherType: VoucherType;
  narration: string;
  reference?: string;
  date: string;
  lines: JournalLine[];
  gst?: GstDetail;
}

/**
 * Resolves a GST input into a concrete tax split.
 *
 * The supply type is derived, never entered: comparing the store's state with
 * the place of supply is the statutory test, and letting a user pick "IGST" by
 * hand is how mismatched returns happen.
 */
function resolveGst(
  amount: Paise,
  input: GstInput,
  direction: "OUTWARD" | "INWARD",
  supplierStateCode: string
): { detail: GstDetail; taxableValue: Paise; totalTax: Paise; gross: Paise } {
  const supplyType = supplyTypeFor(supplierStateCode, input.placeOfSupply);
  const split = input.amountIsInclusive
    ? computeTaxOnInclusiveAmount(amount, input.rate, supplyType)
    : computeTaxOnTaxableValue(amount, input.rate, supplyType);

  const totalTax = addPaise(split.cgst, split.sgst, split.igst, split.cess);

  const detail: GstDetail = {
    direction,
    supplyType,
    rate: input.rate,
    taxableValue: split.taxableValue,
    cgst: split.cgst,
    sgst: split.sgst,
    igst: split.igst,
    cess: split.cess,
    counterpartyGstin: input.counterpartyGstin,
    counterpartyName: input.counterpartyName,
    placeOfSupply: input.placeOfSupply,
    hsnCode: input.hsnCode,
    invoiceNo: input.invoiceNo,
    itcEligible: input.itcEligible ?? direction === "INWARD",
    reverseCharge: input.reverseCharge ?? false,
  };

  return {
    detail,
    taxableValue: split.taxableValue,
    totalTax,
    gross: addPaise(split.taxableValue, totalTax),
  };
}

/**
 * Turns a voucher into a balanced set of journal lines.
 *
 * Every branch here produces debits equal to credits by construction; the
 * result still goes through `validateEntry` before it is persisted, so a future
 * edit to this file cannot quietly corrupt the ledger.
 */
export function buildEntry(voucher: Voucher, context: BuildContext): BuiltEntry {
  const { supplierStateCode } = context;
  const base = {
    date: voucher.date,
    reference: voucher.reference,
  };

  switch (voucher.kind) {
    case "SALE": {
      const settle = settlementAccount(voucher.paymentMode, SYSTEM_ACCOUNTS.debtors);
      if (!voucher.gst) {
        return {
          ...base,
          voucherType: "SALE",
          narration: voucher.narration ?? "Sale of goods",
          lines: [
            debit(settle, voucher.amount),
            credit(SYSTEM_ACCOUNTS.sales, voucher.amount),
          ],
        };
      }
      const { detail, taxableValue, gross } = resolveGst(
        voucher.amount,
        voucher.gst,
        "OUTWARD",
        supplierStateCode
      );
      return {
        ...base,
        voucherType: "SALE",
        narration: voucher.narration ?? "Sale of goods",
        gst: detail,
        lines: compact([
          debit(settle, gross),
          credit(SYSTEM_ACCOUNTS.sales, taxableValue),
          credit(SYSTEM_ACCOUNTS.outputCgst, detail.cgst),
          credit(SYSTEM_ACCOUNTS.outputSgst, detail.sgst),
          credit(SYSTEM_ACCOUNTS.outputIgst, detail.igst),
        ]),
      };
    }

    case "PURCHASE": {
      const settle = settlementAccount(
        voucher.paymentMode,
        SYSTEM_ACCOUNTS.creditors
      );
      if (!voucher.gst) {
        return {
          ...base,
          voucherType: "PURCHASE",
          narration: voucher.narration ?? "Purchase of goods",
          lines: [
            debit(SYSTEM_ACCOUNTS.purchases, voucher.amount),
            credit(settle, voucher.amount),
          ],
        };
      }
      const { detail, taxableValue, totalTax, gross } = resolveGst(
        voucher.amount,
        voucher.gst,
        "INWARD",
        supplierStateCode
      );

      // Blocked credit is not recoverable, so it is not an asset — it becomes
      // part of the cost of the goods and is debited to Purchases.
      if (!detail.itcEligible) {
        return {
          ...base,
          voucherType: "PURCHASE",
          narration: voucher.narration ?? "Purchase of goods (credit blocked)",
          gst: detail,
          lines: compact([
            debit(SYSTEM_ACCOUNTS.purchases, addPaise(taxableValue, totalTax)),
            credit(settle, gross),
          ]),
        };
      }

      return {
        ...base,
        voucherType: "PURCHASE",
        narration: voucher.narration ?? "Purchase of goods",
        gst: detail,
        lines: compact([
          debit(SYSTEM_ACCOUNTS.purchases, taxableValue),
          debit(SYSTEM_ACCOUNTS.inputCgst, detail.cgst),
          debit(SYSTEM_ACCOUNTS.inputSgst, detail.sgst),
          debit(SYSTEM_ACCOUNTS.inputIgst, detail.igst),
          credit(settle, gross),
        ]),
      };
    }

    case "SALES_RETURN": {
      const settle = settlementAccount(voucher.paymentMode, SYSTEM_ACCOUNTS.debtors);
      if (!voucher.gst) {
        return {
          ...base,
          voucherType: "SALES_RETURN",
          narration: voucher.narration ?? "Goods returned by customer",
          lines: [
            debit(SYSTEM_ACCOUNTS.salesReturns, voucher.amount),
            credit(settle, voucher.amount),
          ],
        };
      }
      const { detail, taxableValue, gross } = resolveGst(
        voucher.amount,
        voucher.gst,
        "OUTWARD",
        supplierStateCode
      );
      // A return reverses the original outward supply, so the GST detail is
      // recorded with negative values and nets off in the return.
      const reversed: GstDetail = {
        ...detail,
        taxableValue: -detail.taxableValue,
        cgst: -detail.cgst,
        sgst: -detail.sgst,
        igst: -detail.igst,
        cess: -detail.cess,
      };
      return {
        ...base,
        voucherType: "SALES_RETURN",
        narration: voucher.narration ?? "Goods returned by customer",
        gst: reversed,
        lines: compact([
          debit(SYSTEM_ACCOUNTS.salesReturns, taxableValue),
          debit(SYSTEM_ACCOUNTS.outputCgst, detail.cgst),
          debit(SYSTEM_ACCOUNTS.outputSgst, detail.sgst),
          debit(SYSTEM_ACCOUNTS.outputIgst, detail.igst),
          credit(settle, gross),
        ]),
      };
    }

    case "PURCHASE_RETURN": {
      const settle = settlementAccount(
        voucher.paymentMode,
        SYSTEM_ACCOUNTS.creditors
      );
      if (!voucher.gst) {
        return {
          ...base,
          voucherType: "PURCHASE_RETURN",
          narration: voucher.narration ?? "Goods returned to supplier",
          lines: [
            debit(settle, voucher.amount),
            credit(SYSTEM_ACCOUNTS.purchaseReturns, voucher.amount),
          ],
        };
      }
      const { detail, taxableValue, gross } = resolveGst(
        voucher.amount,
        voucher.gst,
        "INWARD",
        supplierStateCode
      );
      const reversed: GstDetail = {
        ...detail,
        taxableValue: -detail.taxableValue,
        cgst: -detail.cgst,
        sgst: -detail.sgst,
        igst: -detail.igst,
        cess: -detail.cess,
      };
      return {
        ...base,
        voucherType: "PURCHASE_RETURN",
        narration: voucher.narration ?? "Goods returned to supplier",
        gst: reversed,
        lines: compact([
          debit(settle, gross),
          credit(SYSTEM_ACCOUNTS.purchaseReturns, taxableValue),
          credit(SYSTEM_ACCOUNTS.inputCgst, detail.cgst),
          credit(SYSTEM_ACCOUNTS.inputSgst, detail.sgst),
          credit(SYSTEM_ACCOUNTS.inputIgst, detail.igst),
        ]),
      };
    }

    case "EXPENSE": {
      const settle = settlementAccount(
        voucher.paymentMode,
        voucher.payableAccount ?? "2220"
      );
      if (!voucher.gst) {
        return {
          ...base,
          voucherType: "EXPENSE",
          narration: voucher.narration ?? "Expense incurred",
          lines: [
            debit(voucher.expenseAccount, voucher.amount),
            credit(settle, voucher.amount),
          ],
        };
      }
      const { detail, taxableValue, totalTax, gross } = resolveGst(
        voucher.amount,
        voucher.gst,
        "INWARD",
        supplierStateCode
      );
      if (!detail.itcEligible) {
        return {
          ...base,
          voucherType: "EXPENSE",
          narration: voucher.narration ?? "Expense incurred (credit blocked)",
          gst: detail,
          lines: compact([
            debit(voucher.expenseAccount, addPaise(taxableValue, totalTax)),
            credit(settle, gross),
          ]),
        };
      }
      return {
        ...base,
        voucherType: "EXPENSE",
        narration: voucher.narration ?? "Expense incurred",
        gst: detail,
        lines: compact([
          debit(voucher.expenseAccount, taxableValue),
          debit(SYSTEM_ACCOUNTS.inputCgst, detail.cgst),
          debit(SYSTEM_ACCOUNTS.inputSgst, detail.sgst),
          debit(SYSTEM_ACCOUNTS.inputIgst, detail.igst),
          credit(settle, gross),
        ]),
      };
    }

    case "RECEIPT": {
      const into =
        voucher.into === "CASH" ? SYSTEM_ACCOUNTS.cash : SYSTEM_ACCOUNTS.bank;
      return {
        ...base,
        voucherType: "RECEIPT",
        narration: voucher.narration ?? "Amount received",
        lines: [
          debit(into, voucher.amount),
          credit(voucher.fromAccount, voucher.amount),
        ],
      };
    }

    case "PAYMENT": {
      const from =
        voucher.from === "CASH" ? SYSTEM_ACCOUNTS.cash : SYSTEM_ACCOUNTS.bank;
      return {
        ...base,
        voucherType: "PAYMENT",
        narration: voucher.narration ?? "Amount paid",
        lines: [
          debit(voucher.toAccount, voucher.amount),
          credit(from, voucher.amount),
        ],
      };
    }

    case "CONTRA": {
      const toBank = voucher.direction === "CASH_TO_BANK";
      return {
        ...base,
        voucherType: "CONTRA",
        narration:
          voucher.narration ??
          (toBank ? "Cash deposited into bank" : "Cash withdrawn from bank"),
        lines: toBank
          ? [
              debit(SYSTEM_ACCOUNTS.bank, voucher.amount),
              credit(SYSTEM_ACCOUNTS.cash, voucher.amount),
            ]
          : [
              debit(SYSTEM_ACCOUNTS.cash, voucher.amount),
              credit(SYSTEM_ACCOUNTS.bank, voucher.amount),
            ],
      };
    }

    case "CAPITAL": {
      const through =
        voucher.through === "CASH" ? SYSTEM_ACCOUNTS.cash : SYSTEM_ACCOUNTS.bank;
      return {
        ...base,
        voucherType: "JOURNAL",
        narration:
          voucher.narration ??
          (voucher.action === "INTRODUCE"
            ? "Capital introduced by owner"
            : "Drawings by owner"),
        lines:
          voucher.action === "INTRODUCE"
            ? [
                debit(through, voucher.amount),
                credit(SYSTEM_ACCOUNTS.capital, voucher.amount),
              ]
            : [
                debit(SYSTEM_ACCOUNTS.drawings, voucher.amount),
                credit(through, voucher.amount),
              ],
      };
    }

    case "DEPRECIATION": {
      return {
        ...base,
        voucherType: "JOURNAL",
        narration:
          voucher.narration ??
          `Depreciation charged on ${
            context.accountIndex.get(voucher.assetAccount)?.name ??
            voucher.assetAccount
          }`,
        lines: [
          debit(SYSTEM_ACCOUNTS.depreciation, voucher.amount),
          credit(SYSTEM_ACCOUNTS.accumulatedDepreciation, voucher.amount),
        ],
      };
    }

    case "JOURNAL": {
      return {
        ...base,
        voucherType: "JOURNAL",
        narration: voucher.narration ?? "Journal entry",
        lines: compact(voucher.lines),
      };
    }
  }
}

/** Builds an entry and throws unless it is a valid double entry. */
export function buildValidatedEntry(
  voucher: Voucher,
  context: BuildContext
): BuiltEntry {
  const built = buildEntry(voucher, context);
  const result = validateEntry(built.lines, context.accountIndex, built.date);
  if (!result.valid) {
    throw new JournalError(result.issues);
  }
  return built;
}

/** Sorts entries into ledger order: by date, then by voucher number. */
export function sortEntries(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.voucherNo.localeCompare(b.voucherNo, undefined, { numeric: true })
  );
}

export function entryTotal(entry: JournalEntry): Paise {
  return entry.lines.reduce((total, line) => total + line.debit, 0);
}
