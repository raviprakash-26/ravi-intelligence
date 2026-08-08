"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { validateGstin } from "@/lib/accounting/gst";
import { financialYearRange, startYearOf } from "@/lib/accounting/period";
import { getBooksContext } from "@/lib/auth/dal";
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
