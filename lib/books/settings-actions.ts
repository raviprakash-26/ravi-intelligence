"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { buildClosingPlan, findClosingEntry } from "@/lib/accounting/close";
import { validateGstin } from "@/lib/accounting/gst";
import { formatPaise } from "@/lib/accounting/money";
import { financialYearRange, startYearOf } from "@/lib/accounting/period";
import { buildFinancialStatements } from "@/lib/accounting/statements";
import { assertCanWrite, getBooksContext } from "@/lib/auth/dal";
import { PLANS } from "@/lib/billing/plans";
import * as repository from "@/lib/db/repository";
import type { PlanId } from "@/lib/db/repository";

export interface SettingsFormState {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

const settingsSchema = z.object({
  name: z.string().trim().min(2, "Enter the name of your store."),
  legalName: z.string().trim().max(200).optional(),
  stateCode: z.string().regex(/^\d{2}$/, "Select a state."),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(20).optional(),
});

/** Updates the store profile. The state code changes how GST is split, so it is checked against the GSTIN. */
export async function updateStoreSettings(
  _previous: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const context = await getBooksContext();

  if (context.user.role !== "OWNER") {
    return { error: "Only the store owner can change these details." };
  }

  const parsed = settingsSchema.safeParse({
    name: formData.get("name"),
    legalName: formData.get("legalName") ?? undefined,
    stateCode: formData.get("stateCode"),
    address: formData.get("address") ?? undefined,
    phone: formData.get("phone") ?? undefined,
  });

  if (!parsed.success) {
    return {
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }

  const rawGstin = String(formData.get("gstin") ?? "").trim();
  let gstin: string | null = null;
  if (rawGstin) {
    const check = validateGstin(rawGstin);
    if (!check.valid) {
      return { fieldErrors: { gstin: [check.reason ?? "Invalid GSTIN."] } };
    }
    if (check.stateCode !== parsed.data.stateCode) {
      return {
        fieldErrors: {
          gstin: [
            `This GSTIN is registered in ${check.stateName}, which does not match the state selected above.`,
          ],
        },
      };
    }
    gstin = rawGstin.toUpperCase();
  }

  repository.updateTenant(context.tenant.id, {
    name: parsed.data.name,
    legalName: parsed.data.legalName || null,
    stateCode: parsed.data.stateCode,
    address: parsed.data.address || null,
    phone: parsed.data.phone || null,
    gstin,
    pan: gstin ? gstin.slice(2, 12) : null,
  });

  repository.appendAudit({
    tenantId: context.tenant.id,
    userId: context.user.id,
    action: "SETTINGS_UPDATED",
    entity: "tenant",
    entityId: context.tenant.id,
  });

  revalidatePath("/books", "layout");
  return { ok: true, message: "Store details saved." };
}

/**
 * Switches the financial year being worked on.
 *
 * The period row is created if it does not exist yet, and the closing stock of
 * the year just left is carried into the new year as its opening stock — which
 * is what it is, and re-typing it is an invitation to a mismatch.
 */
export async function switchFinancialYear(
  _previous: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const context = await getBooksContext();

  if (context.user.role !== "OWNER") {
    return { error: "Only the store owner can change the working year." };
  }

  // This writes: it moves tenant-wide state and may create the period row. A
  // lapsed tenant keeps read access to the year already selected, and can still
  // reach the plan picker, which is why changePlan is the one write left open.
  const permission = await assertCanWrite();
  if (!permission.ok) {
    return { error: permission.message };
  }

  const label = String(formData.get("financialYear") ?? "");

  let startYear: number;
  try {
    startYear = startYearOf(label);
  } catch {
    return { error: "Choose a valid financial year." };
  }

  const range = financialYearRange(label);
  const existing = repository.getPeriod(context.tenant.id, label);

  if (!existing) {
    const previousLabel = `${startYear - 1}-${String(startYear % 100).padStart(2, "0")}`;
    const previous = repository.getPeriod(context.tenant.id, previousLabel);

    repository.upsertPeriod({
      tenantId: context.tenant.id,
      label,
      startDate: range.from,
      endDate: range.to,
      openingStock: previous?.closingStock ?? 0,
      closingStock: 0,
    });
  }

  repository.updateTenant(context.tenant.id, { financialYear: label });
  repository.appendAudit({
    tenantId: context.tenant.id,
    userId: context.user.id,
    action: "FINANCIAL_YEAR_SWITCHED",
    entity: "tenant",
    entityId: context.tenant.id,
    detail: { financialYear: label },
  });

  revalidatePath("/books", "layout");
  return { ok: true, message: `Now working on ${label}.` };
}

/**
 * Closes the working year.
 *
 * Empties the nominal accounts into Retained Earnings so the year's profit
 * becomes part of what the owner has in the business, and the next year opens
 * on a clean slate. Until this is done the profit of a finished year is
 * stranded in accounts the Balance Sheet does not report, while the cash it
 * produced sits there in plain sight — so the sheet is out by exactly that
 * profit and nothing the shopkeeper enters will square it.
 */
export async function closeFinancialYear(
  _previous: SettingsFormState,
  _formData: FormData
): Promise<SettingsFormState> {
  const context = await getBooksContext();

  if (context.user.role !== "OWNER") {
    return { error: "Only the store owner can close the year." };
  }

  const permission = await assertCanWrite();
  if (!permission.ok) {
    return { error: permission.message };
  }

  const entries = repository.listJournalEntries(context.tenant.id);

  // The profit transferred is the one the statements report, taken from them
  // rather than recomputed, so the two can never drift apart.
  const statements = buildFinancialStatements(
    context.accounts,
    entries,
    context.range,
    context.adjustments
  );

  const result = buildClosingPlan({
    accounts: context.accounts,
    entries,
    range: context.range,
    adjustments: context.adjustments,
    netProfit: statements.profitAndLoss.netProfit,
  });

  if (!result.ok) {
    return { error: result.reason };
  }

  const entry = repository.createJournalEntry({
    tenantId: context.tenant.id,
    date: context.range.to,
    voucherType: "CLOSING",
    narration: `Year-end close for ${context.financialYear}`,
    lines: result.plan.lines,
    createdBy: context.user.id,
  });

  repository.appendAudit({
    tenantId: context.tenant.id,
    userId: context.user.id,
    action: "YEAR_CLOSED",
    entity: "journal_entry",
    entityId: entry.id,
    detail: {
      financialYear: context.financialYear,
      netProfit: result.plan.netProfit,
      accountsClosed: result.plan.accountsClosed,
    },
  });

  revalidatePath("/books", "layout");
  return {
    ok: true,
    message: `${context.financialYear} is closed. ${formatPaise(
      result.plan.netProfit
    )} has been transferred to retained earnings.`,
  };
}

/**
 * Reopens the working year by deleting its closing entry.
 *
 * A shopkeeper who finds a missed bill after closing needs a way back in, and
 * the alternative — a correcting entry in the following year — misstates both
 * years. Closing again afterwards is cheap, so this is deliberately reversible.
 */
export async function reopenFinancialYear(
  _previous: SettingsFormState,
  _formData: FormData
): Promise<SettingsFormState> {
  const context = await getBooksContext();

  if (context.user.role !== "OWNER") {
    return { error: "Only the store owner can reopen the year." };
  }

  const permission = await assertCanWrite();
  if (!permission.ok) {
    return { error: permission.message };
  }

  const entries = repository.listJournalEntries(context.tenant.id);
  const closing = findClosingEntry(entries, context.range);

  if (!closing) {
    return { error: `${context.financialYear} is not closed.` };
  }

  repository.deleteJournalEntry(context.tenant.id, closing.id);

  repository.appendAudit({
    tenantId: context.tenant.id,
    userId: context.user.id,
    action: "YEAR_REOPENED",
    entity: "journal_entry",
    entityId: closing.id,
    detail: { financialYear: context.financialYear },
  });

  revalidatePath("/books", "layout");
  return {
    ok: true,
    message: `${context.financialYear} is open again. Close it once your corrections are in.`,
  };
}

/**
 * Changes the store's plan.
 *
 * There is no payment gateway wired in, so this records the choice and activates
 * it. A real deployment would set the status from a gateway webhook rather than
 * from a form post.
 */
export async function changePlan(
  _previous: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const context = await getBooksContext();

  if (context.user.role !== "OWNER") {
    return { error: "Only the store owner can change the plan." };
  }

  const planId = String(formData.get("plan") ?? "") as PlanId;
  if (!PLANS[planId] || planId === "TRIAL") {
    return { error: "Choose one of the available plans." };
  }

  repository.updateTenant(context.tenant.id, {
    plan: planId,
    subscriptionStatus: "ACTIVE",
  });

  repository.appendAudit({
    tenantId: context.tenant.id,
    userId: context.user.id,
    action: "PLAN_CHANGED",
    entity: "tenant",
    entityId: context.tenant.id,
    detail: { plan: planId },
  });

  revalidatePath("/books", "layout");
  return { ok: true, message: `You are now on the ${PLANS[planId].name} plan.` };
}
