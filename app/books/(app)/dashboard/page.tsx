import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { StockForm } from "@/components/books/stock-form";
import {
  Amount,
  Callout,
  EmptyState,
  LinkButton,
  PageHeader,
  Panel,
  Pill,
  StatCard,
  Table,
  TableWrap,
  Td,
  Th,
} from "@/components/books/ui";
import { SYSTEM_ACCOUNTS } from "@/lib/accounting/chart-of-accounts";
import { buildGstr3b } from "@/lib/accounting/gst";
import { buildTrialBalance, computeBalances } from "@/lib/accounting/ledger";
import { addPaise, formatPaise } from "@/lib/accounting/money";
import { formatDate } from "@/lib/accounting/period";
import { buildFinancialStatements } from "@/lib/accounting/statements";
import { getBooksContext, getEntries } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const context = await getBooksContext();
  const entries = await getEntries(context.range);

  const balances = computeBalances(context.accounts, entries, context.range.to);
  const trialBalance = buildTrialBalance(context.accounts, entries, context.range.to);
  const statements = buildFinancialStatements(
    context.accounts,
    entries,
    context.range,
    context.adjustments
  );
  const gst = buildGstr3b(entries, context.range);

  const cashAndBank = addPaise(
    balances.get(SYSTEM_ACCOUNTS.cash) ?? 0,
    balances.get(SYSTEM_ACCOUNTS.bank) ?? 0
  );
  const debtors = balances.get(SYSTEM_ACCOUNTS.debtors) ?? 0;
  const creditors = balances.get(SYSTEM_ACCOUNTS.creditors) ?? 0;

  const recent = [...entries].reverse().slice(0, 8);
  const stockMissing =
    context.adjustments.closingStock === 0 && entries.length > 0;

  return (
    <>
      <PageHeader
        title={`Good to see you, ${context.user.name.split(" ")[0]}`}
        subtitle={`${context.tenant.name} · Financial year ${context.financialYear}`}
        actions={
          <LinkButton href="/books/transactions/new">Record a transaction</LinkButton>
        }
      />

      {entries.length === 0 ? (
        <Panel>
          <EmptyState
            title="Your books are ready and empty"
            description="Your chart of accounts has been set up. Record your first sale, purchase or expense and the journal, ledger and every report will build themselves from it."
            action={
              <LinkButton href="/books/transactions/new">
                Record your first transaction
              </LinkButton>
            }
          />
        </Panel>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Cash and bank"
              value={<Amount value={cashAndBank} />}
              hint="What you can actually spend today"
              tone={cashAndBank < 0 ? "negative" : "neutral"}
            />
            <StatCard
              label="Net sales"
              value={<Amount value={statements.trading.netSales} />}
              hint={`${context.financialYear} to date, after returns`}
            />
            <StatCard
              label={statements.profitAndLoss.netProfit >= 0 ? "Net profit" : "Net loss"}
              value={
                <Amount value={Math.abs(statements.profitAndLoss.netProfit)} />
              }
              hint="After every expense"
              tone={statements.profitAndLoss.netProfit >= 0 ? "positive" : "negative"}
            />
            <StatCard
              label="GST payable in cash"
              value={<Amount value={gst.setOff.totalCashPayable} />}
              hint="After setting off input credit"
              tone={gst.setOff.totalCashPayable > 0 ? "warning" : "neutral"}
            />
          </div>

          {stockMissing ? (
            <Callout tone="warning" title="Your gross profit needs a stock count">
              Until you enter closing stock, the Trading Account treats every rupee
              of purchases as sold. Enter the value of goods still on your shelves
              below and the figures will correct themselves.
            </Callout>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Panel
                title="Recent transactions"
                actions={
                  <Link
                    href="/books/transactions"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    See all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                }
              >
                <TableWrap>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Date</Th>
                        <Th>Voucher</Th>
                        <Th>Details</Th>
                        <Th align="right">Amount</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((entry) => {
                        const total = entry.lines.reduce(
                          (sum, line) => sum + line.debit,
                          0
                        );
                        return (
                          <tr key={entry.id}>
                            <Td className="whitespace-nowrap text-slate-500 dark:text-slate-400">
                              {formatDate(entry.date)}
                            </Td>
                            <Td>
                              <span className="font-mono text-xs">
                                {entry.voucherNo}
                              </span>
                            </Td>
                            <Td>{entry.narration}</Td>
                            <Td align="right">
                              <Amount value={total} />
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </TableWrap>
              </Panel>
            </div>

            <div className="space-y-6">
              <Panel title="Who owes whom">
                <div className="space-y-3 px-5 py-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      Customers owe you
                    </span>
                    <Amount value={debtors} />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      You owe suppliers
                    </span>
                    <Amount value={creditors} />
                  </div>
                  <div className="flex items-baseline justify-between border-t border-border pt-3">
                    <span className="text-sm font-medium">Net position</span>
                    <Amount value={debtors - creditors} bold signed />
                  </div>
                </div>
              </Panel>

              <Panel title="Health check">
                <div className="space-y-2.5 px-5 py-4 text-sm">
                  {/* Two distinct checks. The trial balance tests that every
                      entry is a valid double entry; the balance sheet can still
                      fail if a figure like opening stock was declared without a
                      matching entry, so conflating them hides the real cause. */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600 dark:text-slate-300">
                      Trial balance
                    </span>
                    <Pill tone={trialBalance.isBalanced ? "green" : "red"}>
                      {trialBalance.isBalanced ? "Ties" : "Does not tie"}
                    </Pill>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600 dark:text-slate-300">
                      Balance sheet
                    </span>
                    <Pill tone={statements.balanceSheet.isBalanced ? "green" : "amber"}>
                      {statements.balanceSheet.isBalanced ? "Balances" : "Off"}
                    </Pill>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600 dark:text-slate-300">
                      Entries recorded
                    </span>
                    <span className="font-mono tabular-nums">{entries.length}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600 dark:text-slate-300">
                      Closing stock
                    </span>
                    {context.adjustments.closingStock > 0 ? (
                      <span className="font-mono text-xs tabular-nums">
                        {formatPaise(context.adjustments.closingStock)}
                      </span>
                    ) : (
                      <Pill tone="amber">Not set</Pill>
                    )}
                  </div>
                </div>
              </Panel>
            </div>
          </div>
        </>
      )}

      <Panel
        title="Stock count"
        description="The two figures that turn your purchases into a real cost of goods sold."
      >
        <StockForm
          openingStock={context.adjustments.openingStock}
          closingStock={context.adjustments.closingStock}
          financialYear={context.financialYear}
        />
      </Panel>
    </>
  );
}
