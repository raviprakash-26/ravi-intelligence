import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { financialYearFor, financialYearRange } from "@/lib/accounting/period";
import type { Account, PeriodAdjustments } from "@/lib/accounting/types";
import {
  planFor,
  planHasFeature,
  subscriptionState,
  type FeatureKey,
} from "@/lib/billing/plans";
import * as repository from "@/lib/db/repository";
import type { Tenant, User } from "@/lib/db/repository";

/**
 * Data access layer.
 *
 * Every read of a store's books goes through here, and every function starts by
 * resolving the session. Authorisation therefore lives next to the data rather
 * than in the pages, so a new page cannot forget to check who is asking. The
 * tenant id always comes from the session — never from a URL parameter or a
 * form field — which is what makes cross-tenant access impossible rather than
 * merely unlikely.
 */

export interface BooksSession {
  userId: string;
  tenantId: string;
}

/**
 * Resolves the session once per render pass.
 *
 * `cache` memoises within a single request, so a layout, a page and three
 * components can each call this without three extra database round trips.
 */
export const getSession = cache(async (): Promise<BooksSession | null> => {
  // Imported lazily so that modules importing the DAL for its types do not pull
  // in the cookie machinery at module scope.
  const { readSession } = await import("./session");
  const session = await readSession();
  if (!session) return null;
  return { userId: session.userId, tenantId: session.tenantId };
});

/** Redirects to the login page when there is no live session. */
export const requireSession = cache(async (): Promise<BooksSession> => {
  const session = await getSession();
  if (!session) redirect("/books/login");
  return session;
});

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const session = await getSession();
  if (!session) return null;
  return repository.getUser(session.userId);
});

export const getCurrentTenant = cache(async (): Promise<Tenant | null> => {
  const session = await getSession();
  if (!session) return null;
  return repository.getTenant(session.tenantId);
});

export interface BooksContext {
  user: User;
  tenant: Tenant;
  accounts: Account[];
  /** The financial year currently being worked on. */
  financialYear: string;
  range: { from: string; to: string };
  adjustments: PeriodAdjustments;
  subscription: ReturnType<typeof subscriptionState>;
  plan: ReturnType<typeof planFor>;
}

/**
 * The full working context for a signed-in shopkeeper: who they are, which
 * store, its chart of accounts, and the period being reported on.
 */
export const getBooksContext = cache(async (): Promise<BooksContext> => {
  const session = await requireSession();

  const user = repository.getUser(session.userId);
  const tenant = repository.getTenant(session.tenantId);

  // A session whose user or tenant has been deleted is not a valid session.
  if (!user || !tenant) redirect("/books/login");

  const accounts = repository.listAccounts(tenant.id);
  const financialYear = tenant.financialYear;
  const range = financialYearRange(financialYear);

  const period = repository.getPeriod(tenant.id, financialYear);
  const adjustments: PeriodAdjustments = {
    openingStock: period?.openingStock ?? 0,
    closingStock: period?.closingStock ?? 0,
  };

  return {
    user,
    tenant,
    accounts,
    financialYear,
    range,
    adjustments,
    subscription: subscriptionState(tenant),
    plan: planFor(tenant.plan),
  };
});

/** Journal entries for the current store, defaulting to the working year. */
export const getEntries = cache(
  async (range?: { from?: string; to?: string }) => {
    const session = await requireSession();
    return repository.listJournalEntries(session.tenantId, range);
  }
);

/** Entries for the whole of the store's history, for trend analysis. */
export const getAllEntries = cache(async () => {
  const session = await requireSession();
  return repository.listJournalEntries(session.tenantId);
});

/**
 * Guards a feature behind the store's plan. Redirects to the pricing page rather
 * than rendering a locked shell, so the reason is always visible.
 */
export async function requireFeature(feature: FeatureKey): Promise<BooksContext> {
  const context = await getBooksContext();
  if (!planHasFeature(context.tenant.plan, feature)) {
    redirect(`/books/settings/plan?locked=${feature}`);
  }
  return context;
}

/**
 * Guards a write. Returns an error message when the subscription has lapsed
 * rather than throwing, so a Server Action can report it in the form.
 */
export async function assertCanWrite(): Promise<{ ok: true } | { ok: false; message: string }> {
  const context = await getBooksContext();

  if (context.subscription.readOnly) {
    return {
      ok: false,
      message:
        context.subscription.message ??
        "Your subscription is not active, so new entries cannot be saved.",
    };
  }

  const limit = context.plan.maxEntriesPerYear;
  if (limit !== null) {
    const used = repository.countJournalEntries(context.tenant.id, context.range);
    if (used >= limit) {
      return {
        ok: false,
        message: `Your ${context.plan.name} plan allows ${limit.toLocaleString("en-IN")} entries a year and you have used all of them. Upgrade to carry on.`,
      };
    }
  }

  return { ok: true };
}

/** Defaults a new store's working year to the one containing today. */
export function defaultFinancialYear(): string {
  return financialYearFor(new Date().toISOString().slice(0, 10)).label;
}
