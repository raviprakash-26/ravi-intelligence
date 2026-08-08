import type { Metadata } from "next";

import {
  Amount,
  ComputationNote,
  PageHeader,
  Panel,
  StatCard,
  StatementRow,
  TAccount,
} from "@/components/books/ui";
import { formatDate } from "@/lib/accounting/period";
import { buildReceiptsAndPayments } from "@/lib/accounting/statements";
import { getBooksContext, getEntries } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Receipts & Payments",
};

export default async function ReceiptsAndPaymentsPage() {
  const context = await getBooksContext();
  const entries = await getEntries();
  const report = buildReceiptsAndPayments(context.accounts, entries, context.range);

  const netMovement = report.closingBalance - report.openingBalance;

  return (
    <>
      <PageHeader
        title="Receipts &amp; Payments Account"
        subtitle={`${formatDate(context.range.from)} to ${formatDate(context.range.to)} · a summary of your cash book`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Cash in hand"
          value={<Amount value={report.closingCash} />}
          hint="In the till and the safe"
        />
        <StatCard
          label="Bank balance"
          value={<Amount value={report.closingBank} />}
          hint="Including UPI and card settlements"
        />
        <StatCard
          label="Change over the year"
          value={<Amount value={netMovement} signed />}
          hint={netMovement >= 0 ? "More money than you started with" : "Less money than you started with"}
          tone={netMovement >= 0 ? "positive" : "warning"}
        />
      </div>

      <Panel>
        <TAccount
          debitTitle="Receipts"
          creditTitle="Payments"
          debitSide={
            <>
              <StatementRow
                label="To Opening Balance"
                amount={report.openingBalance}
              />
              {report.receipts.map((line) => (
                <StatementRow
                  key={line.accountCode}
                  label={`To ${line.label}`}
                  amount={line.amount}
                />
              ))}
              <StatementRow
                label="Total"
                amount={report.openingBalance + report.totalReceipts}
                grand
              />
            </>
          }
          creditSide={
            <>
              {report.payments.map((line) => (
                <StatementRow
                  key={line.accountCode}
                  label={`By ${line.label}`}
                  amount={line.amount}
                />
              ))}
              <StatementRow
                label="By Closing Balance"
                amount={report.closingBalance}
                total
              />
              <StatementRow
                label="Total"
                amount={report.totalPayments + report.closingBalance}
                grand
              />
            </>
          }
        />

        <ComputationNote>
          This is a cash-basis statement: it shows only money that actually moved
          in or out of your cash and bank, whatever period it related to. Transfers
          between your own cash and bank are excluded, since moving money from the
          till to the bank is neither a receipt nor a payment.
        </ComputationNote>
      </Panel>
    </>
  );
}
