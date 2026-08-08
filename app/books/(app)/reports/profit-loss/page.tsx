import type { Metadata } from "next";

import {
  Amount,
  ComputationNote,
  LinkButton,
  PageHeader,
  Panel,
  StatCard,
  StatementRow,
  TAccount,
} from "@/components/books/ui";
import { formatDate } from "@/lib/accounting/period";
import { buildProfitAndLoss, buildTradingAccount } from "@/lib/accounting/statements";
import { getBooksContext, getEntries } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Profit & Loss Account",
};

export default async function ProfitAndLossPage() {
  const context = await getBooksContext();
  const entries = await getEntries(context.range);

  const trading = buildTradingAccount(
    context.accounts,
    entries,
    context.range,
    context.adjustments
  );
  const profitAndLoss = buildProfitAndLoss(
    context.accounts,
    entries,
    context.range,
    trading.grossProfit
  );

  const profitable = profitAndLoss.netProfit >= 0;
  const grossProfit = trading.grossProfit >= 0;

  return (
    <>
      <PageHeader
        title="Profit &amp; Loss Account"
        subtitle={`For the year ended ${formatDate(context.range.to)} · ${context.financialYear}`}
        actions={
          <LinkButton href="/books/reports/balance-sheet" variant="outline">
            Balance Sheet
          </LinkButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Gross profit"
          value={<Amount value={trading.grossProfit} signed />}
          hint="From the Trading Account"
        />
        <StatCard
          label="Total expenses"
          value={<Amount value={profitAndLoss.totalIndirectExpenses} />}
          hint="Rent, salaries and other running costs"
        />
        <StatCard
          label={profitable ? "Net profit" : "Net loss"}
          value={<Amount value={Math.abs(profitAndLoss.netProfit)} />}
          hint={
            trading.netSales > 0
              ? `${((profitAndLoss.netProfit / trading.netSales) * 100).toFixed(1)}% of net sales`
              : undefined
          }
          tone={profitable ? "positive" : "negative"}
        />
      </div>

      <Panel>
        <TAccount
          debitTitle="Dr"
          creditTitle="Cr"
          debitSide={
            <>
              {!grossProfit ? (
                <StatementRow label="To Gross Loss b/d" amount={-trading.grossProfit} />
              ) : null}
              {profitAndLoss.indirectExpenses.map((line) => (
                <StatementRow
                  key={line.accountCode}
                  label={`To ${line.label}`}
                  amount={line.amount}
                />
              ))}
              {profitable ? (
                <StatementRow
                  label="To Net Profit transferred to Capital"
                  amount={profitAndLoss.netProfit}
                  total
                />
              ) : null}
              <StatementRow label="" amount={profitAndLoss.totalDebitSide} grand />
            </>
          }
          creditSide={
            <>
              {grossProfit ? (
                <StatementRow label="By Gross Profit b/d" amount={trading.grossProfit} />
              ) : null}
              {profitAndLoss.indirectIncomes.map((line) => (
                <StatementRow
                  key={line.accountCode}
                  label={`By ${line.label}`}
                  amount={line.amount}
                />
              ))}
              {!profitable ? (
                <StatementRow
                  label="By Net Loss transferred to Capital"
                  amount={-profitAndLoss.netProfit}
                  total
                />
              ) : null}
              <StatementRow label="" amount={profitAndLoss.totalCreditSide} grand />
            </>
          }
        />

        <ComputationNote>
          Net Profit = Gross Profit + Other Income − Indirect Expenses. The result
          is carried to the Capital Account on the Balance Sheet, which is what
          keeps the two statements consistent with one another.
        </ComputationNote>
      </Panel>

      {profitAndLoss.indirectExpenses.length > 0 ? (
        <Panel
          title="Where the money went"
          description="Your running costs, largest first."
        >
          <div className="space-y-2.5 px-5 py-4">
            {[...profitAndLoss.indirectExpenses]
              .sort((a, b) => b.amount - a.amount)
              .map((line) => {
                const share =
                  profitAndLoss.totalIndirectExpenses > 0
                    ? (line.amount / profitAndLoss.totalIndirectExpenses) * 100
                    : 0;
                return (
                  <div key={line.accountCode} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-slate-600 dark:text-slate-300">
                        {line.label}
                      </span>
                      <span className="flex items-baseline gap-2.5">
                        <span className="text-xs text-slate-400">
                          {share.toFixed(0)}%
                        </span>
                        <Amount value={line.amount} />
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${Math.max(share, 1)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </Panel>
      ) : null}
    </>
  );
}
