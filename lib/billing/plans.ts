import type { PlanId } from "@/lib/db/repository";

/**
 * Subscription plans.
 *
 * Gating is enforced in the data access layer rather than by hiding links, so a
 * locked feature is genuinely unavailable and not merely invisible. Prices are
 * in whole rupees per month.
 */

export type FeatureKey =
  | "core-books"
  | "gst-returns"
  | "tax-planner"
  | "ratios"
  | "forecasting"
  | "audit-log"
  | "multi-user"
  | "data-export";

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  /** Null means unlimited. */
  maxUsers: number | null;
  maxEntriesPerYear: number | null;
  features: FeatureKey[];
  highlights: string[];
  recommended?: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  TRIAL: {
    id: "TRIAL",
    name: "Free trial",
    tagline: "Everything unlocked for 14 days",
    monthlyPrice: 0,
    annualPrice: 0,
    maxUsers: 2,
    maxEntriesPerYear: 500,
    features: [
      "core-books",
      "gst-returns",
      "tax-planner",
      "ratios",
      "forecasting",
      "audit-log",
      "multi-user",
      "data-export",
    ],
    highlights: [
      "Every feature, no card needed",
      "Up to 500 entries",
      "Your data stays if you subscribe",
    ],
  },
  STARTER: {
    id: "STARTER",
    name: "Starter",
    tagline: "For a single counter keeping clean books",
    monthlyPrice: 299,
    annualPrice: 2990,
    maxUsers: 1,
    maxEntriesPerYear: 2000,
    features: ["core-books", "gst-returns", "data-export"],
    highlights: [
      "Journal, ledger and trial balance",
      "Trading, P&L and Balance Sheet",
      "GSTR-1 and GSTR-3B summaries",
      "2,000 entries a year",
    ],
  },
  PROFESSIONAL: {
    id: "PROFESSIONAL",
    name: "Professional",
    tagline: "For a growing store that plans ahead",
    monthlyPrice: 699,
    annualPrice: 6990,
    maxUsers: 3,
    maxEntriesPerYear: null,
    features: [
      "core-books",
      "gst-returns",
      "tax-planner",
      "ratios",
      "forecasting",
      "data-export",
      "multi-user",
    ],
    highlights: [
      "Everything in Starter, unlimited entries",
      "Income tax planner with regime comparison",
      "Profitability and liquidity ratios",
      "Revenue forecasting",
      "Up to 3 users",
    ],
    recommended: true,
  },
  BUSINESS: {
    id: "BUSINESS",
    name: "Business",
    tagline: "For multiple outlets and an outside auditor",
    monthlyPrice: 1499,
    annualPrice: 14990,
    maxUsers: 10,
    maxEntriesPerYear: null,
    features: [
      "core-books",
      "gst-returns",
      "tax-planner",
      "ratios",
      "forecasting",
      "audit-log",
      "multi-user",
      "data-export",
    ],
    highlights: [
      "Everything in Professional",
      "Full audit trail of every change",
      "Up to 10 users including your accountant",
      "Priority support",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["STARTER", "PROFESSIONAL", "BUSINESS"];

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  "core-books": "Journal, ledger and financial statements",
  "gst-returns": "GST returns",
  "tax-planner": "Income tax planner",
  ratios: "Financial ratios",
  forecasting: "Revenue forecasting",
  "audit-log": "Audit trail",
  "multi-user": "Additional users",
  "data-export": "Data export",
};

export function planFor(id: PlanId): Plan {
  return PLANS[id] ?? PLANS.TRIAL;
}

export function planHasFeature(id: PlanId, feature: FeatureKey): boolean {
  return planFor(id).features.includes(feature);
}

/**
 * Whether a subscription still grants access.
 *
 * An expired trial keeps the data readable but stops new entries — losing a
 * shop's books because a card expired would be indefensible, so lapsing
 * restricts writing rather than reading.
 */
export function subscriptionState(tenant: {
  plan: PlanId;
  subscriptionStatus: string;
  trialEndsAt: string | null;
}): {
  active: boolean;
  readOnly: boolean;
  daysLeft: number | null;
  message: string | null;
} {
  if (tenant.subscriptionStatus === "ACTIVE") {
    return { active: true, readOnly: false, daysLeft: null, message: null };
  }

  if (tenant.subscriptionStatus === "TRIALING" && tenant.trialEndsAt) {
    const msLeft = new Date(tenant.trialEndsAt).getTime() - Date.now();
    const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));

    if (msLeft <= 0) {
      return {
        active: false,
        readOnly: true,
        daysLeft: 0,
        message:
          "Your free trial has ended. Your books are safe and you can still read every report — choose a plan to start entering transactions again.",
      };
    }

    return {
      active: true,
      readOnly: false,
      daysLeft,
      message:
        daysLeft <= 3
          ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in your free trial.`
          : null,
    };
  }

  if (tenant.subscriptionStatus === "PAST_DUE") {
    return {
      active: false,
      readOnly: true,
      daysLeft: null,
      message:
        "There is a problem with your subscription. Your books remain readable — update your plan to continue entering transactions.",
    };
  }

  return {
    active: false,
    readOnly: true,
    daysLeft: null,
    message:
      "Your subscription is not active. Your books remain readable — choose a plan to continue entering transactions.",
  };
}

export function formatPlanPrice(plan: Plan): string {
  if (plan.monthlyPrice === 0) return "Free";
  return `₹${plan.monthlyPrice.toLocaleString("en-IN")}`;
}
