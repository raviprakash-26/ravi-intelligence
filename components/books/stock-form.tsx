"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { paiseToRupees, type Paise } from "@/lib/accounting/money";
import { updateStock, type StockFormState } from "@/lib/books/voucher-actions";

import { SubmitButton } from "./auth-forms";

const EMPTY: StockFormState = {};

/**
 * Records the counted stock at each end of the year.
 *
 * These two numbers are not derived from anything — a shop without per-item
 * tracking knows them only from a physical count — and gross profit is
 * meaningless without them, which is why they get their own prominent form
 * rather than being buried in settings.
 */
export function StockForm({
  openingStock,
  closingStock,
  financialYear,
}: {
  openingStock: Paise;
  closingStock: Paise;
  financialYear: string;
}) {
  const [state, formAction] = useActionState(updateStock, EMPTY);

  const asInput = (value: Paise) => (value === 0 ? "" : String(paiseToRupees(value)));

  return (
    <form action={formAction} className="space-y-4 px-5 py-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="openingStock"
            className="block text-sm font-medium text-foreground"
          >
            Stock on 1 April
          </label>
          <input
            id="openingStock"
            name="openingStock"
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={asInput(openingStock)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm tabular-nums text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            What last year&apos;s count closed at.
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="closingStock"
            className="block text-sm font-medium text-foreground"
          >
            Stock on 31 March
          </label>
          <input
            id="closingStock"
            name="closingStock"
            inputMode="decimal"
            placeholder="0.00"
            defaultValue={asInput(closingStock)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm tabular-nums text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Value the goods still on your shelves at cost.
          </p>
        </div>
      </div>

      {state.error ? (
        <p
          role="alert"
          className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </p>
      ) : null}

      {state.ok ? (
        <p
          role="status"
          className="flex items-start gap-2 text-sm text-emerald-600 dark:text-emerald-400"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {state.message}
        </p>
      ) : null}

      <div className="max-w-xs">
        <SubmitButton pendingLabel="Saving…">Save stock for {financialYear}</SubmitButton>
      </div>
    </form>
  );
}
