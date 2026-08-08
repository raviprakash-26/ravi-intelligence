import type { Metadata } from "next";

import {
  Callout,
  ComputationNote,
  LinkButton,
  PageHeader,
  Panel,
  StatementRow,
  TAccount,
} from "@/components/books/ui";
import { formatDate } from "@/lib/accounting/period";
import { buildTradingAccount } from "@/lib/accounting/statements";
import { getBooksContext, getEntries } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Trading Account",
};

export default async function TradingAccountPage() {
  const context = await getBooksContext();
  const entries = await getEntries(context.range);
  const trading = buildTradingAccount(
    context.accounts,
    entries,
    context.range,
    context.adjustments
  );

  const grossProfit = trading.grossProfit >= 0;

  return (
    <>
      <PageHeader
        title="Trading Account"
        subtitle={`For the year ended ${formatDate(context.range.to)} · ${context.financialYear}`}
        actions={
          <LinkButton href="/books/reports/profit-loss" variant="outline">
            Profit &amp; Loss
          </LinkButton>
        }
      />

      {context.adjustments.closingStock === 0 ? (
        <Callout tone="warning" title="Closing stock has not been entered">
          Without it, everything you bought is treated as sold and gross profit is
          understated. Enter the value of the goods still on your shelves on the
          dashboard.
        </Callout>
      ) : null}

      <Panel>
        <TAccount
          debitTitle="Dr"
          creditTitle="Cr"
          debitSide={
            <>
              <StatementRow label="To Opening Stock" amount={trading.openingStock} />
              <StatementRow label="To Purchases" amount={trading.purchases} />
              {trading.purchaseReturns !== 0 ? (
                <StatementRow
                  label="Less: Purchase Returns"
                  amount={-trading.purchaseReturns}
                  indent
                />
              ) : null}
              {trading.directExpenses.map((line) => (
                <StatementRow
                  key={line.accountCode}
                  label={`To ${line.label}`}
                  amount={line.amount}
                />
              ))}
              {grossProfit ? (
                <StatementRow
                  label="To Gross Profit c/d"
                  amount={trading.grossProfit}
                  total
                />
              ) : null}
              <StatementRow label="" amount={trading.totalDebitSide} grand />
            </>
          }
          creditSide={
            <>
              <StatementRow label="By Sales" amount={trading.sales} />
              {trading.salesReturns !== 0 ? (
                <StatementRow
                  label="Less: Sales Returns"
                  amount={-trading.salesReturns}
                  indent
                />
              ) : null}
              <StatementRow label="By Closing Stock" amount={trading.closingStock} />
              {!grossProfit ? (
                <StatementRow
                  label="By Gross Loss c/d"
                  amount={-trading.grossProfit}
                  total
                />
              ) : null}
              <StatementRow label="" amount={trading.totalCreditSide} grand />
            </>
          }
        />

        <div className="border-t border-border bg-slate-50 px-5 py-4 dark:bg-slate-800/40">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-semibold">
              {grossProfit ? "Gross Profit" : "Gross Loss"}
            </span>
            <span
              className={
                grossProfit
                  ? "font-mono text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400"
                  : "font-mono text-lg font-semibold tabular-nums text-red-600 dark:text-red-400"
              }
            >
              {(Math.abs(trading.grossProfit) / 100).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          {trading.netSales > 0 ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {((trading.grossProfit / trading.netSales) * 100).toFixed(1)}% of net
              sales of ₹
              {(trading.netSales / 100).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              . This is what is left to cover rent, salaries and every other
              running cost.
            </p>
          ) : null}
        </div>

        <ComputationNote>
          Gross Profit = (Net Sales + Closing Stock) − (Opening Stock + Net
          Purchases + Direct Expenses). Stock is counted rather than tracked per
          item, so the opening and closing figures come from your own count.
        </ComputationNote>
      </Panel>
    </>
  );
}
