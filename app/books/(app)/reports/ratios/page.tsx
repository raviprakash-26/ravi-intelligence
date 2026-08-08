import type { Metadata } from "next";

import {
  Amount,
  ComputationNote,
  PageHeader,
  Panel,
  Pill,
} from "@/components/books/ui";
import { elapsedDaysInRange, formatDate } from "@/lib/accounting/period";
import { buildFinancialStatements } from "@/lib/accounting/statements";
import {
  computeRatios,
  costOfGoodsSold,
  formatRatio,
  type Ratio,
} from "@/lib/accounting/ratios";
import { requireFeature, getEntries } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Financial Ratios",
};

const HEALTH_LABEL: Record<NonNullable<Ratio["health"]>, string> = {
  good: "Healthy",
  watch: "Worth watching",
  poor: "Needs attention",
};

const HEALTH_TONE: Record<NonNullable<Ratio["health"]>, "green" | "amber" | "red"> = {
  good: "green",
  watch: "amber",
  poor: "red",
};

export default async function RatiosPage() {
  const context = await requireFeature("ratios");
  const entries = await getEntries(context.range);

  const statements = buildFinancialStatements(
    context.accounts,
    entries,
    context.range,
    context.adjustments
  );

  // Turnover ratios are annualised over the days actually traded, not a flat
  // 365 — half a year of sales against a full year would halve every figure.
  const daysInPeriod = Math.max(1, elapsedDaysInRange(context.range));

  const ratios = computeRatios({
    trading: statements.trading,
    profitAndLoss: statements.profitAndLoss,
    balanceSheet: statements.balanceSheet,
    daysInPeriod,
  });

  const groups: Array<{ title: string; description: string; keys: string[] }> = [
    {
      title: "Profitability",
      description: "How much of what you sell you actually keep.",
      keys: [
        "gross-profit-ratio",
        "net-profit-ratio",
        "operating-ratio",
        "return-on-capital-employed",
        "return-on-capital",
      ],
    },
    {
      title: "Liquidity",
      description: "Whether you can pay what falls due in the near term.",
      keys: ["current-ratio", "quick-ratio"],
    },
    {
      title: "Efficiency",
      description: "How quickly stock moves and money comes back to you.",
      keys: [
        "stock-turnover",
        "stock-holding-days",
        "debtors-turnover",
        "collection-period",
        "payment-period",
      ],
    },
  ];

  return (
    <>
      <PageHeader
        title="Financial Ratios"
        subtitle={`Computed over ${daysInPeriod} days to ${formatDate(
          context.range.to < new Date().toISOString().slice(0, 10)
            ? context.range.to
            : new Date().toISOString().slice(0, 10)
        )}`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Cost of goods sold
          </p>
          <div className="mt-1.5 text-xl font-semibold">
            <Amount value={costOfGoodsSold(statements.trading)} />
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Opening stock + purchases − closing stock
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Net sales
          </p>
          <div className="mt-1.5 text-xl font-semibold">
            <Amount value={statements.trading.netSales} />
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            After sales returns
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Capital employed
          </p>
          <div className="mt-1.5 text-xl font-semibold">
            <Amount
              value={
                statements.balanceSheet.closingCapital +
                statements.balanceSheet.totalLongTermLiabilities
              }
            />
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Capital + long-term borrowings
          </p>
        </div>
      </div>

      {groups.map((group) => (
        <Panel key={group.title} title={group.title} description={group.description}>
          <div className="divide-y divide-border">
            {group.keys
              .map((key) => ratios.find((ratio) => ratio.key === key))
              .filter((ratio): ratio is Ratio => Boolean(ratio))
              .map((ratio) => (
                <div key={ratio.key} className="px-5 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {ratio.label}
                    </span>
                    <span className="flex items-center gap-2.5">
                      {ratio.health && ratio.value !== null ? (
                        <Pill tone={HEALTH_TONE[ratio.health]}>
                          {HEALTH_LABEL[ratio.health]}
                        </Pill>
                      ) : null}
                      <span className="font-mono text-lg font-semibold tabular-nums">
                        {formatRatio(ratio)}
                      </span>
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {ratio.value === null
                      ? "Not enough activity yet to compute this."
                      : ratio.interpretation}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-slate-400">
                    {ratio.formula}
                  </p>
                </div>
              ))}
          </div>
        </Panel>
      ))}

      <Panel>
        <ComputationNote>
          The health bands are rules of thumb for a general retail business, not
          standards. What counts as a healthy margin or stock turnover varies a
          great deal by trade — a jeweller and a grocer should not be judged
          against the same numbers. Compare these against your own earlier years
          before comparing them against anyone else.
        </ComputationNote>
      </Panel>
    </>
  );
}
