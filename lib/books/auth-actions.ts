"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";

import { financialYearFor, financialYearRange, todayIso } from "@/lib/accounting/period";
import { validateGstin } from "@/lib/accounting/gst";
import { checkPasswordStrength, hashPassword, verifyPassword } from "@/lib/auth/password";
import { endSession, startSession } from "@/lib/auth/session";
import { transaction } from "@/lib/db/client";
import * as repository from "@/lib/db/repository";

export interface AuthFormState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string>;
}

const registerSchema = z.object({
  storeName: z.string().trim().min(2, "Enter the name of your store."),
  ownerName: z.string().trim().min(2, "Enter your name."),
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Choose a password."),
  stateCode: z.string().regex(/^\d{2}$/, "Select the state your store is in."),
  gstin: z.string().trim().optional(),
  phone: z.string().trim().optional(),
});

/**
 * Creates a store and its first user.
 *
 * The tenant, the owner, the chart of accounts and the opening period are
 * written in one transaction: a store that exists without accounts would fail on
 * its first entry with an incomprehensible error, so either all of it lands or
 * none of it does.
 */
export async function registerStore(
  _previous: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const raw = {
    storeName: String(formData.get("storeName") ?? ""),
    ownerName: String(formData.get("ownerName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    stateCode: String(formData.get("stateCode") ?? ""),
    gstin: String(formData.get("gstin") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
  };

  // Echoed back so a failed submission does not clear the form.
  const values = { ...raw, password: "" };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      values,
    };
  }

  const strength = checkPasswordStrength(parsed.data.password);
  if (!strength.acceptable) {
    return { fieldErrors: { password: strength.issues }, values };
  }

  // A GSTIN is optional — plenty of small shops are below the threshold — but a
  // wrong one silently breaks every return, so it is checked when supplied.
  let gstin: string | null = null;
  if (raw.gstin) {
    const check = validateGstin(raw.gstin);
    if (!check.valid) {
      return { fieldErrors: { gstin: [check.reason ?? "Invalid GSTIN."] }, values };
    }
    if (check.stateCode !== parsed.data.stateCode) {
      return {
        fieldErrors: {
          gstin: [
            `This GSTIN is registered in ${check.stateName}, which does not match the state you selected.`,
          ],
        },
        values,
      };
    }
    gstin = raw.gstin.toUpperCase();
  }

  if (repository.emailExists(parsed.data.email)) {
    return {
      fieldErrors: { email: ["An account already exists with this email."] },
      values,
    };
  }

  const { hash, salt } = await hashPassword(parsed.data.password);
  const financialYear = financialYearFor(todayIso()).label;
  const range = financialYearRange(financialYear);

  let tenantId: string;
  let userId: string;

  try {
    const created = transaction(() => {
      const tenant = repository.createTenant({
        name: parsed.data.storeName,
        stateCode: parsed.data.stateCode,
        financialYear,
        gstin,
        pan: gstin ? gstin.slice(2, 12) : null,
        phone: parsed.data.phone || null,
      });

      repository.seedChartOfAccounts(tenant.id);
      repository.upsertPeriod({
        tenantId: tenant.id,
        label: financialYear,
        startDate: range.from,
        endDate: range.to,
        openingStock: 0,
        closingStock: 0,
      });

      const user = repository.createUser({
        tenantId: tenant.id,
        email: parsed.data.email,
        name: parsed.data.ownerName,
        passwordHash: hash,
        passwordSalt: salt,
        role: "OWNER",
      });

      repository.appendAudit({
        tenantId: tenant.id,
        userId: user.id,
        action: "STORE_CREATED",
        entity: "tenant",
        entityId: tenant.id,
        detail: { storeName: tenant.name },
      });

      return { tenantId: tenant.id, userId: user.id };
    });

    tenantId = created.tenantId;
    userId = created.userId;
  } catch (error) {
    console.error("[books] registration failed", error);
    return {
      error: "Something went wrong creating your store. Please try again.",
      values,
    };
  }

  const userAgent = (await headers()).get("user-agent") ?? undefined;
  await startSession({ userId, tenantId, userAgent });

  // redirect throws internally, so it must sit outside the try block above.
  redirect("/books/dashboard");
}

const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

/**
 * Signs a user in.
 *
 * A wrong email and a wrong password produce the same message and take the same
 * work, so the form cannot be used to discover which addresses are registered.
 */
export async function login(
  _previous: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const values = { email: raw.email, password: "" };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
      values,
    };
  }

  const user = repository.findUserByEmailWithSecret(parsed.data.email);

  // Hash against a dummy salt when the user does not exist so that both paths
  // cost the same, rather than returning instantly and revealing the difference.
  const passwordMatches = user
    ? await verifyPassword(parsed.data.password, user.passwordHash, user.passwordSalt)
    : await verifyPassword(parsed.data.password, "00".repeat(64), "decoy");

  if (!user || !passwordMatches) {
    return { error: "Email or password is incorrect.", values };
  }

  repository.recordLogin(user.id);
  repository.appendAudit({
    tenantId: user.tenantId,
    userId: user.id,
    action: "LOGIN",
    entity: "user",
    entityId: user.id,
  });

  const userAgent = (await headers()).get("user-agent") ?? undefined;
  await startSession({ userId: user.id, tenantId: user.tenantId, userAgent });

  redirect("/books/dashboard");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/books/login");
}
