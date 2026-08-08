import type { Metadata } from "next";
import { Trash2 } from "lucide-react";

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
import type { VoucherType } from "@/lib/accounting/types";
import { getBooksContext, getEntries } from "@/lib/auth/dal";
import { deleteEntry } from "@/lib/books/voucher-actions";

export const metadata: Metadata = {
  title: "All transactions",
};

const VOUCHER_STYLE: Record<
  VoucherType,
  { label: string; tone: "neutral" | "blue" | "green" | "amber" | "red" }
> = {
  SALE: { label: "Sale", tone: "green" },
  PURCHASE: { label: "Purchase", tone: "blue" },
  SALES_RETURN: { label: "Sales return", tone: "amber" },
  PURCHASE_RETURN: { label: "Purchase return", tone: "amber" },
  EXPENSE: { label: "Expense", tone: "red" },
  RECEIPT: { label: "Receipt", tone: "green" },
  PAYMENT: { label: "Payment", tone: "red" },
  CONTRA: { label: "Contra", tone: "neutral" },
  JOURNAL: { label: "Journal", tone: "neutral" },
  OPENING: { label: "Opening", tone: "neutral" },
  CLOSING: { label: "Year-end close", tone: "blue" },
};

export default async function TransactionsPage() {
  const context = await getBooksContext();
  const entries = await getEntries(context.range);
  const accountIndex = buildAccountIndex(context.accounts);

  const ordered = [...entries].reverse();

  return (
    <>
      <PageHeader
        title="All transactions"
        subtitle={`${entries.length} recorded in ${context.financialYear}`}
        actions={<LinkButton href="/books/transactions/new">Record a transaction</LinkButton>}
      />

      <Panel>
        {ordered.length === 0 ? (
          <EmptyState
            title="Nothing recorded yet"
            description="Every sale, purchase and expense you record will be listed here, newest first."
            action={<LinkButton href="/books/transactions/new">Record a transaction</LinkButton>}
          />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Voucher</Th>
                  <Th>Type</Th>
                  <Th>Details</Th>
                  <Th>Accounts</Th>
                  <Th align="right">Amount</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {ordered.map((entry) => {
                  const total = entry.lines.reduce((sum, line) => sum + line.debit, 0);
                  const style = VOUCHER_STYLE[entry.voucherType];

                  return (
                    <tr key={entry.id}>
                      <Td className="whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {formatDate(entry.date)}
                      </Td>
                      <Td>
                        <span className="font-mono text-xs">{entry.voucherNo}</span>
                      </Td>
                      <Td>
                        <Pill tone={style.tone}>{style.label}</Pill>
                      </Td>
                      <Td>
                        {entry.narration}
                        {entry.reference ? (
                          <span className="block text-xs text-slate-400">
                            {entry.reference}
                          </span>
                        ) : null}
                      </Td>
                      <Td className="text-xs text-slate-500 dark:text-slate-400">
                        {entry.lines
                          .map(
                            (line) =>
                              accountIndex.get(line.accountCode)?.name ??
                              line.accountCode
                          )
                          .join(", ")}
                        {entry.gst ? (
                          <span className="mt-1 block">
                            GST {entry.gst.rate}% ·{" "}
                            {entry.gst.supplyType === "INTRA_STATE"
                              ? "CGST + SGST"
                              : "IGST"}
                          </span>
                        ) : null}
                      </Td>
                      <Td align="right">
                        <Amount value={total} />
                      </Td>
                      <Td align="right">
                        {/* Entries are deleted rather than edited: amending a
                            posted entry in place would destroy the audit trail.
                            The deletion itself is recorded in the audit log. */}
                        <form action={deleteEntry}>
                          <input type="hidden" name="entryId" value={entry.id} />
                          <button
                            type="submit"
                            aria-label={`Delete ${entry.voucherNo}`}
                            title="Delete this entry"
                            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </form>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Panel>
    </>
  );
}
