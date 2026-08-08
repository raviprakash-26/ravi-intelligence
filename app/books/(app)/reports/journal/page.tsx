import type { Metadata } from "next";
import { Fragment } from "react";

import {
  Amount,
  EmptyState,
  LinkButton,
  PageHeader,
  Panel,
  Pill,
  Table,
  TableWrap,
  Td,
  Th,
} from "@/components/books/ui";
import { buildAccountIndex } from "@/lib/accounting/chart-of-accounts";
import { formatDate } from "@/lib/accounting/period";
import { getBooksContext, getEntries } from "@/lib/auth/dal";
import type { VoucherType } from "@/lib/accounting/types";

export const metadata: Metadata = {
  title: "Journal",
};

const VOUCHER_LABELS: Record<VoucherType, string> = {
  SALE: "Sale",
  PURCHASE: "Purchase",
  SALES_RETURN: "Sales return",
  PURCHASE_RETURN: "Purchase return",
  EXPENSE: "Expense",
  RECEIPT: "Receipt",
  PAYMENT: "Payment",
  CONTRA: "Contra",
  JOURNAL: "Journal",
  OPENING: "Opening",
};

export default async function JournalPage() {
  const context = await getBooksContext();
  const entries = await getEntries(context.range);
  const accountIndex = buildAccountIndex(context.accounts);

  const totals = entries.reduce(
    (sum, entry) => sum + entry.lines.reduce((lineSum, line) => lineSum + line.debit, 0),
    0
  );

  return (
    <>
      <PageHeader
        title="Journal"
        subtitle={`Every entry in date order · ${context.financialYear}`}
        actions={<LinkButton href="/books/transactions/new">Record a transaction</LinkButton>}
      />

      <Panel
        title={`${entries.length} entries`}
        description="Each transaction as a debit and a credit, in the order it happened."
      >
        {entries.length === 0 ? (
          <EmptyState
            title="Nothing recorded yet"
            description="The journal fills itself as you record transactions."
            action={<LinkButton href="/books/transactions/new">Record a transaction</LinkButton>}
          />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Voucher</Th>
                  <Th>Particulars</Th>
                  <Th align="right">Debit</Th>
                  <Th align="right">Credit</Th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <Fragment key={entry.id}>
                    {entry.lines.map((line, index) => (
                      <tr key={`${entry.id}-${index}`}>
                        <Td className="whitespace-nowrap text-slate-500 dark:text-slate-400">
                          {index === 0 ? formatDate(entry.date) : ""}
                        </Td>
                        <Td>
                          {index === 0 ? (
                            <span className="font-mono text-xs">{entry.voucherNo}</span>
                          ) : null}
                        </Td>
                        <Td>
                          {/* Credits are indented under their debits, the way a
                              journal is written by hand. */}
                          <span className={line.credit > 0 ? "pl-6" : undefined}>
                            {line.credit > 0 ? "To " : ""}
                            {accountIndex.get(line.accountCode)?.name ?? line.accountCode}
                          </span>
                        </Td>
                        <Td align="right">
                          {line.debit > 0 ? <Amount value={line.debit} showSymbol={false} /> : "—"}
                        </Td>
                        <Td align="right">
                          {line.credit > 0 ? <Amount value={line.credit} showSymbol={false} /> : "—"}
                        </Td>
                      </tr>
                    ))}
                    <tr>
                      <Td />
                      <Td />
                      <Td className="pb-3 pt-0">
                        <span className="text-xs italic text-slate-500 dark:text-slate-400">
                          ({entry.narration}
                          {entry.reference ? ` · ${entry.reference}` : ""})
                        </span>
                        <span className="ml-2 inline-block align-middle">
                          <Pill>{VOUCHER_LABELS[entry.voucherType]}</Pill>
                        </span>
                      </Td>
                      <Td />
                      <Td />
                    </tr>
                  </Fragment>
                ))}
                <tr className="bg-slate-50 font-semibold dark:bg-slate-800/40">
                  <Td colSpan={3}>Total</Td>
                  <Td align="right">
                    <Amount value={totals} bold showSymbol={false} />
                  </Td>
                  <Td align="right">
                    <Amount value={totals} bold showSymbol={false} />
                  </Td>
                </tr>
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Panel>
    </>
  );
}
