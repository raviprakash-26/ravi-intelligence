import type { Metadata } from "next";
import Link from "next/link";

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
import { buildFinancialStatements } from "@/lib/accounting/statements";
import { getAllEntries, getBooksContext } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Balance Sheet",
};

export default async function BalanceSheetPage() {
  const context = await getBooksContext();
  // Full history. buildBalanceSheet takes balances as at range.to and the P&L
  // windows itself to the year, so this is the input both want; a year-filtered
  // list silently drops brought-forward assets, liabilities and capital.
  const entries = await getAllEntries();
  const { balanceSheet, profitAndLoss } = buildFinancialStatements(
    context.accounts,
    entries,
    context.range,
    context.adjustments
  );

  // The most common cause of an out-of-balance sheet by far: opening stock was
  // declared but never entered into the ledger, so the asset has no counterpart.
  // Naming it beats sending the shopkeeper off to audit a trial balance that ties.
  const unfundedOpeningStock =
    context.adjustments.openingStock > 0 &&
    Math.abs(balanceSheet.difference) === context.adjustments.openingStock;

  return (
    <>
      <PageHeader
        title="Balance Sheet"
        subtitle={`As at ${formatDate(context.range.to)} · ${context.financialYear}`}
        actions={
          <LinkButton href="/books/reports/ratios" variant="outline">
            Ratios
          </LinkButton>
        }
      />

      {balanceSheet.isBalanced ? (
        <Callout tone="success" title="The sheet balances">
          Total assets equal capital plus liabilities to the paise, which is the
          arithmetic proof that the year&apos;s books hang together.
        </Callout>
      ) : (
        <Callout tone="warning" title="The sheet does not balance">
          Assets and liabilities differ by ₹
          {(Math.abs(balanceSheet.difference) / 100).toFixed(2)}.{" "}
          {unfundedOpeningStock ? (
            <>
              That is exactly your opening stock, which means the goods you
              started the year with are shown as an asset with nothing funding
              them. Re-save the stock figures on the{" "}
              <Link href="/books/dashboard">dashboard</Link> and the matching
              opening entry will be written for you.
            </>
          ) : (
            <>
              Every entry is checked to balance when it is saved, so the cause is
              usually a figure declared outside the ledger — most often opening
              stock, or opening balances that were never recorded. Start with the{" "}
              <Link href="/books/reports/trial-balance">Trial Balance</Link>.
            </>
          )}
        </Callout>
      )}

      <Panel>
        <TAccount
          debitTitle="Liabilities & Capital"
          creditTitle="Assets"
          debitSide={
            <>
              <StatementRow label="Capital Account" />
              <StatementRow
                label="Opening capital"
                amount={balanceSheet.openingCapital}
                indent
              />
              <StatementRow
                label={profitAndLoss.netProfit >= 0 ? "Add: Net Profit" : "Less: Net Loss"}
                amount={balanceSheet.netProfit}
                indent
              />
              {balanceSheet.drawings !== 0 ? (
                <StatementRow
                  label="Less: Drawings"
                  amount={-balanceSheet.drawings}
                  indent
                />
              ) : null}
              <StatementRow
                label="Closing capital"
                amount={balanceSheet.closingCapital}
                total
              />

              {balanceSheet.longTermLiabilities.length > 0 ? (
                <>
                  <StatementRow label="Long-term Liabilities" />
                  {balanceSheet.longTermLiabilities.map((line) => (
                    <StatementRow
                      key={line.accountCode}
                      label={line.label}
                      amount={line.amount}
                      indent
                    />
                  ))}
                </>
              ) : null}

              {balanceSheet.currentLiabilities.length > 0 ? (
                <>
                  <StatementRow label="Current Liabilities" />
                  {balanceSheet.currentLiabilities.map((line) => (
                    <StatementRow
                      key={line.accountCode}
                      label={line.label}
                      amount={line.amount}
                      indent
                    />
                  ))}
                  <StatementRow
                    label="Total current liabilities"
                    amount={balanceSheet.totalCurrentLiabilities}
                    total
                  />
                </>
              ) : null}

              <StatementRow
                label="Total"
                amount={balanceSheet.totalLiabilitiesAndCapital}
                grand
              />
            </>
          }
          creditSide={
            <>
              {balanceSheet.fixedAssets.length > 0 ? (
                <>
                  <StatementRow label="Fixed Assets" />
                  {balanceSheet.fixedAssets.map((line) => (
                    <StatementRow
                      key={line.accountCode}
                      label={line.label}
                      amount={line.amount}
                      indent
                    />
                  ))}
                  {balanceSheet.accumulatedDepreciation !== 0 ? (
                    <StatementRow
                      label="Less: Accumulated Depreciation"
                      amount={-balanceSheet.accumulatedDepreciation}
                      indent
                    />
                  ) : null}
                  <StatementRow
                    label="Net fixed assets"
                    amount={balanceSheet.netFixedAssets}
                    total
                  />
                </>
              ) : null}

              <StatementRow label="Current Assets" />
              {balanceSheet.currentAssets.map((line) => (
                <StatementRow
                  key={line.accountCode}
                  label={line.label}
                  amount={line.amount}
                  indent
                  note={
                    line.accountCode === "1200" ? "from your stock count" : undefined
                  }
                />
              ))}
              <StatementRow
                label="Total current assets"
                amount={balanceSheet.totalCurrentAssets}
                total
              />

              <StatementRow label="Total" amount={balanceSheet.totalAssets} grand />
            </>
          }
        />

        <ComputationNote>
          Closing stock is shown from your physical count rather than from the
          Stock account, which under periodic stock-keeping still carries the
          opening figure at year end. The Trading Account uses the same number, so
          the two statements agree with one another.
        </ComputationNote>
      </Panel>
    </>
  );
}
