import type { Metadata } from "next";
import Link from "next/link";

import {
  Amount,
  EmptyState,
  LinkButton,
  PageHeader,
  Panel,
  Table,
  TableWrap,
  Td,
  Th,
} from "@/components/books/ui";
import { buildAllLedgers, buildLedgerAccount } from "@/lib/accounting/ledger";
import { formatDate } from "@/lib/accounting/period";
import { normalBalanceOf } from "@/lib/accounting/types";
import { getBooksContext, getEntries } from "@/lib/auth/dal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ledger",
};

export default async function LedgerPage(props: {
  searchParams: Promise<{ account?: string }>;
}) {
  const { account: requestedCode } = await props.searchParams;
  const context = await getBooksContext();
  const entries = await getEntries(context.range);

  // Only accounts with activity are worth listing; a chart of 50 accounts of
  // which 6 are used makes the useful ones hard to find.
  const activeLedgers = buildAllLedgers(context.accounts, entries, context.range);

  const selectedCode = requestedCode ?? activeLedgers[0]?.account.code;
  const selectedAccount = context.accounts.find(
    (candidate) => candidate.code === selectedCode
  );

  const ledger = selectedAccount
    ? buildLedgerAccount(selectedAccount, entries, context.range)
    : null;

  return (
    <>
      <PageHeader
        title="Ledger"
        subtitle={`Each account's own account, with a running balance · ${context.financialYear}`}
        actions={<LinkButton href="/books/reports/trial-balance" variant="outline">Trial Balance</LinkButton>}
      />

      {activeLedgers.length === 0 ? (
        <Panel>
          <EmptyState
            title="No accounts have moved yet"
            description="Once you record a transaction, each account it touches gets its own ledger page here."
            action={<LinkButton href="/books/transactions/new">Record a transaction</LinkButton>}
          />
        </Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <Panel title="Accounts">
            <nav className="max-h-[32rem] space-y-0.5 overflow-y-auto p-2">
              {activeLedgers.map((candidate) => (
                <Link
                  key={candidate.account.code}
                  href={`/books/reports/ledger?account=${candidate.account.code}`}
                  className={cn(
                    "flex items-baseline justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                    candidate.account.code === selectedCode
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                >
                  <span className="truncate">{candidate.account.name}</span>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums opacity-70">
                    {candidate.movements.length}
                  </span>
                </Link>
              ))}
            </nav>
          </Panel>

          {ledger && selectedAccount ? (
            <Panel
              title={selectedAccount.name}
              description={
                selectedAccount.description ??
                `${selectedAccount.type.toLowerCase()} · normally a ${normalBalanceOf(
                  selectedAccount.type,
                  selectedAccount.isContra
                ).toLowerCase()} balance`
              }
            >
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <Th>Date</Th>
                      <Th>Voucher</Th>
                      <Th>Particulars</Th>
                      <Th align="right">Debit</Th>
                      <Th align="right">Credit</Th>
                      <Th align="right">Balance</Th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-slate-500 dark:text-slate-400">
                      <Td />
                      <Td />
                      <Td>Opening balance</Td>
                      <Td />
                      <Td />
                      <Td align="right">
                        <Amount value={ledger.openingBalance} showSymbol={false} />
                      </Td>
                    </tr>

                    {ledger.movements.map((movement) => (
                      <tr key={`${movement.entryId}-${movement.voucherNo}`}>
                        <Td className="whitespace-nowrap text-slate-500 dark:text-slate-400">
                          {formatDate(movement.date)}
                        </Td>
                        <Td>
                          <span className="font-mono text-xs">{movement.voucherNo}</span>
                        </Td>
                        <Td>{movement.narration}</Td>
                        <Td align="right">
                          {movement.debit > 0 ? (
                            <Amount value={movement.debit} showSymbol={false} />
                          ) : (
                            "—"
                          )}
                        </Td>
                        <Td align="right">
                          {movement.credit > 0 ? (
                            <Amount value={movement.credit} showSymbol={false} />
                          ) : (
                            "—"
                          )}
                        </Td>
                        <Td align="right">
                          <Amount value={movement.runningBalance} showSymbol={false} />
                        </Td>
                      </tr>
                    ))}

                    <tr className="bg-slate-50 font-semibold dark:bg-slate-800/40">
                      <Td colSpan={3}>Closing balance</Td>
                      <Td align="right">
                        <Amount value={ledger.totalDebit} bold showSymbol={false} />
                      </Td>
                      <Td align="right">
                        <Amount value={ledger.totalCredit} bold showSymbol={false} />
                      </Td>
                      <Td align="right">
                        <Amount value={ledger.closingBalance} bold showSymbol={false} />
                      </Td>
                    </tr>
                  </tbody>
                </Table>
              </TableWrap>

              <p className="border-t border-border px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                The balance column runs in this account&apos;s normal direction, so a
                positive figure means a{" "}
                {normalBalanceOf(selectedAccount.type, selectedAccount.isContra).toLowerCase()}{" "}
                balance.
              </p>
            </Panel>
          ) : (
            <Panel>
              <EmptyState
                title="Account not found"
                description="Pick an account from the list to see its ledger."
              />
            </Panel>
          )}
        </div>
      )}
    </>
  );
}
