"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { buildAccountIndex, SYSTEM_ACCOUNTS } from "@/lib/accounting/chart-of-accounts";
import { validateGstin } from "@/lib/accounting/gst";
import { buildEntry, validateEntry, type Voucher } from "@/lib/accounting/journal";
import { computeBalances } from "@/lib/accounting/ledger";
import { MoneyError, rupeesToPaise, type Paise } from "@/lib/accounting/money";
import { financialYearRange } from "@/lib/accounting/period";
import type { GstRate } from "@/lib/accounting/types";
import { assertCanWrite, getBooksContext } from "@/lib/auth/dal";
import * as repository from "@/lib/db/repository";

export interface VoucherFormState {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

const GST_RATE_VALUES = [0, 0.25, 3, 5, 12, 18, 28] as const;

const baseSchema = z.object({
  kind: z.enum([
    "SALE", "PURCHASE", "SALES_RETURN", "PURCHASE_RETURN", "EXPENSE",
    "RECEIPT", "PAYMENT", "CONTRA", "CAPITAL", "DEPRECIATION", "JOURNAL",
  ]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date."),
  amount: z.string().min(1, "Enter an amount."),
  narration: z.string().trim().max(300).optional(),
  reference: z.string().trim().max(100).optional(),
});

function readGst(formData: FormData, context: { stateCode: string }) {
  if (formData.get("hasGst") !== "on") return undefined;

  const rate = Number(formData.get("gstRate") ?? 0);
  const gstRate = (GST_RATE_VALUES as readonly number[]).includes(rate)
    ? (rate as GstRate)
    : 18;

  const placeOfSupply = String(formData.get("placeOfSupply") ?? context.stateCode);
  const counterpartyGstin = String(formData.get("counterpartyGstin") ?? "").trim();

  return {
    rate: gstRate,
    placeOfSupply: /^\d{2}$/.test(placeOfSupply) ? placeOfSupply : context.stateCode,
    amountIsInclusive: formData.get("amountIsInclusive") === "on",
    counterpartyGstin: counterpartyGstin ? counterpartyGstin.toUpperCase() : undefined,
    counterpartyName:
      String(formData.get("counterpartyName") ?? "").trim() || undefined,
    hsnCode: String(formData.get("hsnCode") ?? "").trim() || undefined,
    invoiceNo: String(formData.get("invoiceNo") ?? "").trim() || undefined,
    // Blocked credits under Section 17(5) must be marked, or the store claims
    // credit it is not entitled to and pays it back with interest later.
    itcEligible: formData.get("itcBlocked") !== "on",
  };
}

/**
 * Records a transaction.
 *
 * The form collects what a shopkeeper knows — what was sold, for how much, paid
 * how — and the voucher builders turn that into double entry. The resulting
 * lines are validated before they are written, so no combination of form input
 * can produce an unbalanced entry.
 */
export async function postVoucher(
  _previous: VoucherFormState,
  formData: FormData
): Promise<VoucherFormState> {
  const context = await getBooksContext();

  const permission = await assertCanWrite();
  if (!permission.ok) {
    return { error: permission.message };
  }

  const parsedBase = baseSchema.safeParse({
    kind: formData.get("kind"),
    date: formData.get("date"),
    amount: formData.get("amount"),
    narration: formData.get("narration") ?? undefined,
    reference: formData.get("reference") ?? undefined,
  });

  if (!parsedBase.success) {
    return {
      fieldErrors: z.flattenError(parsedBase.error).fieldErrors as Record<string, string[]>,
    };
  }

  const { kind, date, narration, reference } = parsedBase.data;

  // Entries outside the working year would silently vanish from every report.
  const range = financialYearRange(context.financialYear);
  if (date < range.from || date > range.to) {
    return {
      fieldErrors: {
        date: [
          `This date is outside ${context.financialYear} (${range.from} to ${range.to}). Switch financial year in Settings to record it.`,
        ],
      },
    };
  }

  let amount: number;
  try {
    amount = rupeesToPaise(parsedBase.data.amount);
  } catch (error) {
    return {
      fieldErrors: {
        amount: [error instanceof MoneyError ? error.message : "Enter a valid amount."],
      },
    };
  }

  // A manual journal carries its amounts on the lines, not in this field — the
  // form posts a hidden zero for it. Every other kind needs a positive figure.
  if (kind !== "JOURNAL" && amount <= 0) {
    return { fieldErrors: { amount: ["Enter an amount greater than zero."] } };
  }

  const gst = readGst(formData, { stateCode: context.tenant.stateCode });
  if (gst?.counterpartyGstin) {
    const check = validateGstin(gst.counterpartyGstin);
    if (!check.valid) {
      return { fieldErrors: { counterpartyGstin: [check.reason ?? "Invalid GSTIN."] } };
    }
  }

  const paymentMode = (String(formData.get("paymentMode") ?? "CASH") || "CASH") as
    | "CASH" | "BANK" | "CREDIT";

  let voucher: Voucher;
  switch (kind) {
    case "SALE":
    case "PURCHASE":
    case "SALES_RETURN":
    case "PURCHASE_RETURN":
      voucher = { kind, date, amount, narration, reference, paymentMode, gst };
      break;

    case "EXPENSE": {
      const expenseAccount = String(formData.get("expenseAccount") ?? "");
      if (!expenseAccount) {
        return { fieldErrors: { expenseAccount: ["Choose which expense this is."] } };
      }
      voucher = {
        kind: "EXPENSE",
        date, amount, narration, reference, paymentMode, expenseAccount, gst,
      };
      break;
    }

    case "RECEIPT": {
      const fromAccount = String(formData.get("fromAccount") ?? "1100");
      voucher = {
        kind: "RECEIPT",
        date, amount, narration, reference, fromAccount,
        into: formData.get("into") === "BANK" ? "BANK" : "CASH",
      };
      break;
    }

    case "PAYMENT": {
      const toAccount = String(formData.get("toAccount") ?? "2010");
      voucher = {
        kind: "PAYMENT",
        date, amount, narration, reference, toAccount,
        from: formData.get("from") === "BANK" ? "BANK" : "CASH",
      };
      break;
    }

    case "CONTRA":
      voucher = {
        kind: "CONTRA",
        date, amount, narration, reference,
        direction:
          formData.get("direction") === "BANK_TO_CASH" ? "BANK_TO_CASH" : "CASH_TO_BANK",
      };
      break;

    case "CAPITAL":
      voucher = {
        kind: "CAPITAL",
        date, amount, narration, reference,
        action: formData.get("capitalAction") === "WITHDRAW" ? "WITHDRAW" : "INTRODUCE",
        through: formData.get("through") === "BANK" ? "BANK" : "CASH",
      };
      break;

    case "DEPRECIATION":
      voucher = {
        kind: "DEPRECIATION",
        date, amount, narration, reference,
        assetAccount: String(formData.get("assetAccount") ?? "1400"),
      };
      break;

    case "JOURNAL": {
      const lines = readManualLines(formData);
      if (lines.length < 2) {
        return { error: "A manual entry needs at least two lines." };
      }
      voucher = { kind: "JOURNAL", date, amount: 0, narration, reference, lines };
      break;
    }
  }

  const accountIndex = buildAccountIndex(context.accounts);

  let built;
  try {
    built = buildEntry(voucher, {
      supplierStateCode: context.tenant.stateCode,
      accountIndex,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not record this entry.",
    };
  }

  const validation = validateEntry(built.lines, accountIndex, built.date);
  if (!validation.valid) {
    return { error: validation.issues.join(" ") };
  }

  try {
    const entry = repository.createJournalEntry({
      tenantId: context.tenant.id,
      date: built.date,
      voucherType: built.voucherType,
      narration: built.narration,
      lines: built.lines,
      reference: built.reference,
      gst: built.gst,
      createdBy: context.user.id,
    });

    repository.appendAudit({
      tenantId: context.tenant.id,
      userId: context.user.id,
      action: "ENTRY_CREATED",
      entity: "journal_entry",
      entityId: entry.id,
      detail: { voucherNo: entry.voucherNo, amount: validation.totalDebit },
    });

    revalidatePath("/books", "layout");

    return {
      ok: true,
      message: `Recorded as ${entry.voucherNo}.`,
    };
  } catch (error) {
    console.error("[books] failed to save entry", error);
    return { error: "Could not save this entry. Please try again." };
  }
}

/** Reads the repeating debit/credit rows of the manual journal form. */
function readManualLines(formData: FormData) {
  const accountCodes = formData.getAll("lineAccount").map(String);
  const debits = formData.getAll("lineDebit").map(String);
  const credits = formData.getAll("lineCredit").map(String);

  const lines = [];
  for (let index = 0; index < accountCodes.length; index += 1) {
    const accountCode = accountCodes[index];
    if (!accountCode) continue;

    const parse = (value: string) => {
      if (!value || !value.trim()) return 0;
      try {
        return rupeesToPaise(value);
      } catch {
        return 0;
      }
    };

    const debit = parse(debits[index] ?? "");
    const credit = parse(credits[index] ?? "");
    if (debit === 0 && credit === 0) continue;

    lines.push({ accountCode, debit, credit });
  }
  return lines;
}

export async function deleteEntry(formData: FormData): Promise<void> {
  const context = await getBooksContext();

  const permission = await assertCanWrite();
  if (!permission.ok) return;

  const entryId = String(formData.get("entryId") ?? "");
  if (!entryId) return;

  const entry = repository.getJournalEntry(context.tenant.id, entryId);
  if (!entry) return;

  repository.deleteJournalEntry(context.tenant.id, entryId);
  repository.appendAudit({
    tenantId: context.tenant.id,
    userId: context.user.id,
    action: "ENTRY_DELETED",
    entity: "journal_entry",
    entityId: entryId,
    // The deleted entry is kept in the audit detail so the trail survives it.
    detail: { voucherNo: entry.voucherNo, narration: entry.narration, lines: entry.lines },
  });

  revalidatePath("/books", "layout");
}

export interface StockFormState {
  ok?: boolean;
  message?: string;
  error?: string;
}

/**
 * Records the counted opening and closing stock for the working year.
 *
 * These two figures drive the Trading Account and the Balance Sheet; without
 * them gross profit is meaningless, which is why the dashboard nags until they
 * are set.
 */
export async function updateStock(
  _previous: StockFormState,
  formData: FormData
): Promise<StockFormState> {
  const context = await getBooksContext();

  const permission = await assertCanWrite();
  if (!permission.ok) return { error: permission.message };

  let openingStock: number;
  let closingStock: number;
  try {
    openingStock = rupeesToPaise(String(formData.get("openingStock") ?? "0") || "0");
    closingStock = rupeesToPaise(String(formData.get("closingStock") ?? "0") || "0");
  } catch (error) {
    return {
      error: error instanceof MoneyError ? error.message : "Enter valid stock values.",
    };
  }

  if (openingStock < 0 || closingStock < 0) {
    return { error: "Stock values cannot be negative." };
  }

  const range = financialYearRange(context.financialYear);
  repository.upsertPeriod({
    tenantId: context.tenant.id,
    label: context.financialYear,
    startDate: range.from,
    endDate: range.to,
    openingStock,
    closingStock,
  });

  const openingEntry = syncOpeningStockEntry(context.tenant.id, context.user.id, {
    financialYear: context.financialYear,
    range,
    openingStock,
  });

  repository.appendAudit({
    tenantId: context.tenant.id,
    userId: context.user.id,
    action: "STOCK_UPDATED",
    entity: "period",
    entityId: context.financialYear,
    detail: { openingStock, closingStock },
  });

  revalidatePath("/books", "layout");
  return {
    ok: true,
    message: openingEntry
      ? `Stock figures saved. Opening stock was also recorded as ${openingEntry}, debited to Stock against your capital — without that entry the stock would appear on the Balance Sheet with nothing funding it.`
      : "Stock figures saved.",
  };
}

/**
 * Keeps an opening balance entry in step with the declared opening stock.
 *
 * Opening stock is goods the business already owns on day one, so it has to
 * exist in the ledger as well as in the period record. Left as a bare
 * adjustment it lands on the Balance Sheet as an asset with nothing on the
 * other side, and the sheet fails to balance by exactly that amount — which
 * looks like a bug in the books rather than a missing entry.
 *
 * The counterpart is the owner's capital, because stock brought into the
 * business at the point the books open is precisely what the owner has put in.
 * Only stock that is not already carried in from a prior year is posted, so a
 * store that has been running here for years is left untouched.
 *
 * @returns the voucher number when an entry was written, otherwise null.
 */
function syncOpeningStockEntry(
  tenantId: string,
  userId: string,
  options: {
    financialYear: string;
    range: { from: string; to: string };
    openingStock: Paise;
  }
): string | null {
  const { range, openingStock } = options;
  const allEntries = repository.listJournalEntries(tenantId);

  // An entry this function wrote previously *for this year*, which must be
  // replaced rather than added to when the figure is edited. The range check is
  // load-bearing: each year carries its own opening-stock entry, and an
  // unscoped search finds the earliest one in the store's history and deletes
  // it, retroactively unbalancing a year that has already been closed and filed.
  const existing = allEntries.find(
    (entry) =>
      entry.voucherType === "OPENING" &&
      entry.date >= range.from &&
      entry.date <= range.to &&
      entry.lines.some((line) => line.accountCode === SYSTEM_ACCOUNTS.closingStock)
  );

  if (existing) {
    const previousAmount =
      existing.lines.find(
        (line) => line.accountCode === SYSTEM_ACCOUNTS.closingStock
      )?.debit ?? 0;
    if (previousAmount === openingStock) return null;
    repository.deleteJournalEntry(tenantId, existing.id);
  }

  if (openingStock <= 0) return null;

  // Stock genuinely carried forward from an earlier year is already in the
  // ledger and must not be posted a second time.
  if (!existing) {
    const carriedIn = computeBalances(
      repository.listAccounts(tenantId),
      allEntries.filter((entry) => entry.date < range.from)
    ).get(SYSTEM_ACCOUNTS.closingStock);

    if (carriedIn && carriedIn !== 0) return null;
  }

  const entry = repository.createJournalEntry({
    tenantId,
    date: range.from,
    voucherType: "OPENING",
    narration: "Opening stock brought into the business",
    lines: [
      { accountCode: SYSTEM_ACCOUNTS.closingStock, debit: openingStock, credit: 0 },
      { accountCode: SYSTEM_ACCOUNTS.capital, debit: 0, credit: openingStock },
    ],
    createdBy: userId,
  });

  repository.appendAudit({
    tenantId,
    userId,
    action: "OPENING_STOCK_POSTED",
    entity: "journal_entry",
    entityId: entry.id,
    detail: { voucherNo: entry.voucherNo, openingStock },
  });

  return entry.voucherNo;
}
