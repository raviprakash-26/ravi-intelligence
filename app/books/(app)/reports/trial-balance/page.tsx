import type { Metadata } from "next";

import {
  Amount,
  Callout,
  EmptyState,
  LinkButton,
  PageHeader,
  Panel,
  Table,
  TableWrap,
  Td,
  Th,
} from "@/components/books/ui";
import { formatDate } from "@/lib/accounting/period";
import { buildTrialBalance } from "@/lib/accounting/ledger";
import { getBooksContext, getEntries } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Trial Balance",
};

export default async function TrialBalancePage() {
  const context = await getBooksContext();
  const entries = await getEntries(context.range);
  const trialBalance = buildTrialBalance(context.accounts, entries, context.range.to);

  return (
    <>
      <PageHeader
        title="Trial Balance"
        subtitle={`As at ${formatDate(context.range.to)} · ${context.financialYear}`}
        actions={<LinkButton href="/books/reports/balance-sheet" variant="outline">Balance Sheet</LinkButton>}
      />

      {trialBalance.rows.length === 0 ? (
        <Panel>
          <EmptyState
            title="Nothing to balance yet"
            description="Record a transaction and every account it touches will appear here."
            action={<LinkButton href="/books/transactions/new">Record a transaction</LinkButton>}
          />
        </Panel>
      ) : (
        <>
          {trialBalance.isBalanced ? (
            <Callout tone="success" title="The books tie">
              Total debits equal total credits, so the ledger is internally
              consistent. Every entry is checked to balance before it is saved, so
              this is a confirmation rather than a coincidence.
            </Callout>
          ) : (
            <Callout tone="danger" title="The books do not tie">
              Debits and credits differ by{" "}
              {Math.abs(trialBalance.totalDebit - trialBalance.totalCredit) / 100}{" "}
              rupees. Every entry is validated on save, so this points at data
              changed outside the application. Do not rely on the statements below
              until it is resolved.
            </Callout>
          )}

          <Panel title="Balances by account">
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Code</Th>
                    <Th>Account</Th>
                    <Th>Type</Th>
                    <Th align="right">Debit</Th>
                    <Th align="right">Credit</Th>
                  </tr>
                </thead>
                <tbody>
                  {trialBalance.rows.map((row) => (
                    <tr key={row.account.code}>
                      <Td className="font-mono text-xs text-slate-500">
                        {row.account.code}
                      </Td>
                      <Td>{row.account.name}</Td>
                      <Td className="text-xs capitalize text-slate-500 dark:text-slate-400">
                        {row.account.type.toLowerCase()}
                      </Td>
                      <Td align="right">
                        {row.debit > 0 ? (
                          <Amount value={row.debit} showSymbol={false} />
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td align="right">
                        {row.credit > 0 ? (
                          <Amount value={row.credit} showSymbol={false} />
                        ) : (
                          "—"
                        )}
                      </Td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-semibold dark:bg-slate-800/40">
                    <Td colSpan={3}>Total</Td>
                    <Td align="right">
                      <Amount value={trialBalance.totalDebit} bold showSymbol={false} />
                    </Td>
                    <Td align="right">
                      <Amount value={trialBalance.totalCredit} bold showSymbol={false} />
                    </Td>
                  </tr>
                </tbody>
              </Table>
            </TableWrap>
          </Panel>
        </>
      )}
    </>
  );
}
