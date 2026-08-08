import type { Metadata } from "next";

import {
  Callout,
  ComputationNote,
  PageHeader,
  Panel,
  StatementRow,
  TAccount,
} from "@/components/books/ui";
import { formatDate } from "@/lib/accounting/period";
import { buildFinancialStatements } from "@/lib/accounting/statements";
import { getBooksContext, getEntries } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Income & Expenditure",
};

export default async function IncomeAndExpenditurePage() {
  const context = await getBooksContext();
  const entries = await getEntries(context.range);
  const { incomeAndExpenditure, profitAndLoss } = buildFinancialStatements(
    context.accounts,
    entries,
    context.range,
    context.adjustments
  );

  const surplus = incomeAndExpenditure.surplus >= 0;
  const agrees = incomeAndExpenditure.surplus === profitAndLoss.netProfit;

  return (
    <>
      <PageHeader
        title="Income &amp; Expenditure Account"
        subtitle={`For the year ended ${formatDate(context.range.to)} · accrual basis`}
      />

      <Panel>
        <TAccount
          debitTitle="Expenditure"
          creditTitle="Income"
          debitSide={
            <>
              {incomeAndExpenditure.expenditures.map((line, index) => (
                <StatementRow
                  key={line.accountCode ?? `expenditure-${index}`}
                  label={line.label}
                  amount={line.amount}
                  indent={line.label.startsWith("Less:") || line.label.startsWith("Add:")}
                />
              ))}
              {surplus ? (
                <StatementRow
                  label="Surplus — excess of income over expenditure"
                  amount={incomeAndExpenditure.surplus}
                  total
                />
              ) : null}
              <StatementRow
                label="Total"
                amount={
                  incomeAndExpenditure.totalExpenditure +
                  (surplus ? incomeAndExpenditure.surplus : 0)
                }
                grand
              />
            </>
          }
          creditSide={
            <>
              {incomeAndExpenditure.incomes.map((line, index) => (
                <StatementRow
                  key={line.accountCode ?? `income-${index}`}
                  label={line.label}
                  amount={line.amount}
                  indent={line.label.startsWith("Less:")}
                />
              ))}
              {!surplus ? (
                <StatementRow
                  label="Deficit — excess of expenditure over income"
                  amount={-incomeAndExpenditure.surplus}
                  total
                />
              ) : null}
              <StatementRow
                label="Total"
                amount={
                  incomeAndExpenditure.totalIncome +
                  (!surplus ? -incomeAndExpenditure.surplus : 0)
                }
                grand
              />
            </>
          }
        />

        <ComputationNote>
          This statement matches income to the period it was earned in and expenses
          to the period they were incurred, regardless of when the money moved —
          which is what separates it from the Receipts &amp; Payments Account. The
          change in stock is included so that purchases become the cost of goods
          actually consumed.
        </ComputationNote>
      </Panel>

      {agrees ? (
        <Callout tone="info" title="This agrees with your Profit & Loss Account">
          The surplus here equals the net profit, as it must — the two statements
          are different presentations of the same year. If they ever disagree,
          something is wrong with the books.
        </Callout>
      ) : (
        <Callout tone="danger" title="This does not agree with your Profit & Loss Account">
          The surplus and the net profit should be identical. The difference is ₹
          {(
            Math.abs(incomeAndExpenditure.surplus - profitAndLoss.netProfit) / 100
          ).toFixed(2)}
          .
        </Callout>
      )}
    </>
  );
}
