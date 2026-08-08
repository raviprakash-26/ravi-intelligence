"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { changePlan, type SettingsFormState } from "@/lib/books/settings-actions";
import { FEATURE_LABELS, PLANS, PLAN_ORDER } from "@/lib/billing/plans";
import type { PlanId } from "@/lib/db/repository";
import { cn } from "@/lib/utils";

const EMPTY: SettingsFormState = {};

export function PlanPicker({
  currentPlan,
  canChange,
  lockedFeature,
}: {
  currentPlan: PlanId;
  canChange: boolean;
  lockedFeature?: string;
}) {
  const [state, formAction] = useActionState(changePlan, EMPTY);

  return (
    <div className="space-y-5">
      {lockedFeature && FEATURE_LABELS[lockedFeature as keyof typeof FEATURE_LABELS] ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          <strong className="font-semibold">
            {FEATURE_LABELS[lockedFeature as keyof typeof FEATURE_LABELS]}
          </strong>{" "}
          is not included in your current plan. The plans below that include it are
          marked.
        </div>
      ) : null}

      {state.error ? (
        <p role="alert" className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </p>
      ) : null}

      {state.ok ? (
        <p role="status" className="flex items-start gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const isCurrent = plan.id === currentPlan;
          const unlocksFeature =
            lockedFeature &&
            plan.features.includes(lockedFeature as (typeof plan.features)[number]);

          return (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col rounded-xl border bg-card p-5 shadow-sm",
                isCurrent
                  ? "border-primary ring-1 ring-primary/30"
                  : unlocksFeature
                    ? "border-emerald-500/50"
                    : "border-border"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-foreground">{plan.name}</h3>
                {isCurrent ? (
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Current
                  </span>
                ) : unlocksFeature ? (
                  <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                    Unlocks it
                  </span>
                ) : null}
              </div>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {plan.tagline}
              </p>

              <p className="mt-4">
                <span className="font-mono text-2xl font-semibold tabular-nums">
                  ₹{plan.monthlyPrice.toLocaleString("en-IN")}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400"> / month</span>
              </p>

              <ul className="mt-4 flex-1 space-y-2">
                {plan.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span className="text-slate-600 dark:text-slate-300">{highlight}</span>
                  </li>
                ))}
              </ul>

              <form action={formAction} className="mt-5">
                <input type="hidden" name="plan" value={plan.id} />
                <button
                  type="submit"
                  disabled={isCurrent || !canChange}
                  className={cn(
                    "h-10 w-full rounded-lg text-sm font-medium transition-colors",
                    isCurrent
                      ? "cursor-default border border-border text-slate-400"
                      : "bg-primary text-white hover:bg-blue-700 disabled:opacity-50"
                  )}
                >
                  {isCurrent ? "Your current plan" : `Switch to ${plan.name}`}
                </button>
              </form>
            </div>
          );
        })}
      </div>

      {!canChange ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Only the store owner can change the plan.
        </p>
      ) : null}
    </div>
  );
}
