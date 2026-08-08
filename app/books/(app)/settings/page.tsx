import type { Metadata } from "next";
import Link from "next/link";

import {
  FinancialYearForm,
  StoreSettingsForm,
  YearEndForm,
} from "@/components/books/settings-forms";
import {
  Amount,
  LinkButton,
  PageHeader,
  Panel,
  Pill,
  Table,
  TableWrap,
  Td,
  Th,
} from "@/components/books/ui";
import { isPeriodClosed } from "@/lib/accounting/close";
import { formatPaise } from "@/lib/accounting/money";
import { recentFinancialYears } from "@/lib/accounting/period";
import { buildFinancialStatements } from "@/lib/accounting/statements";
import { getAllEntries, getBooksContext } from "@/lib/auth/dal";
import { listAccounts } from "@/lib/db/repository";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const context = await getBooksContext();
  const accounts = listAccounts(context.tenant.id);

  // Full history, so the profit quoted on the close control is the same figure
  // the P&L reports rather than one derived from a narrower slice.
  const entries = await getAllEntries();
  const closed = isPeriodClosed(entries, context.range);
  const { profitAndLoss } = buildFinancialStatements(
    accounts,
    entries,
    context.range,
    context.adjustments
  );

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle={context.tenant.name}
        actions={
          <LinkButton href="/books/settings/plan" variant="outline">
            Manage plan
          </LinkButton>
        }
      />

      <Panel
        title="Store details"
        description="Used on your reports and to decide how GST applies to your sales."
      >
        <StoreSettingsForm
          name={context.tenant.name}
          legalName={context.tenant.legalName}
          gstin={context.tenant.gstin}
          stateCode={context.tenant.stateCode}
          address={context.tenant.address}
          phone={context.tenant.phone}
          canEdit={context.user.role === "OWNER"}
        />
      </Panel>

      <Panel
        title="Financial year"
        description={`Currently working on ${context.financialYear}, from ${context.range.from} to ${context.range.to}.`}
      >
        <FinancialYearForm
          current={context.financialYear}
          options={recentFinancialYears(5)}
        />
      </Panel>

      <Panel
        title="Year end"
        description={
          closed
            ? `${context.financialYear} has been closed.`
            : `Close ${context.financialYear} once every entry for the year is in.`
        }
      >
        <YearEndForm
          financialYear={context.financialYear}
          isClosed={closed}
          netProfit={formatPaise(profitAndLoss.netProfit)}
          canEdit={context.user.role === "OWNER"}
        />
      </Panel>

      <Panel
        title="Your plan"
        description="What your subscription includes today."
      >
        <div className="space-y-3 px-5 py-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-slate-600 dark:text-slate-300">Plan</span>
            <span className="flex items-center gap-2">
              <Pill tone="blue">{context.plan.name}</Pill>
              <span className="font-mono tabular-nums">
                ₹{context.plan.monthlyPrice.toLocaleString("en-IN")} / month
              </span>
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-slate-600 dark:text-slate-300">Status</span>
            <Pill tone={context.subscription.active ? "green" : "amber"}>
              {context.tenant.subscriptionStatus.toLowerCase()}
            </Pill>
          </div>
          {context.subscription.daysLeft !== null ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-slate-300">
                Trial remaining
              </span>
              <span>{context.subscription.daysLeft} days</span>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-slate-600 dark:text-slate-300">Entry limit</span>
            <span>
              {context.plan.maxEntriesPerYear === null
                ? "Unlimited"
                : `${context.plan.maxEntriesPerYear.toLocaleString("en-IN")} a year`}
            </span>
          </div>
          <p className="pt-1">
            <Link
              href="/books/settings/plan"
              className="text-sm font-medium text-primary hover:underline"
            >
              Change plan →
            </Link>
          </p>
        </div>
      </Panel>

      <Panel
        title="Chart of accounts"
        description={`${accounts.length} accounts. Built-in accounts are used by the reports and cannot be removed.`}
      >
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Code</Th>
                <Th>Account</Th>
                <Th>Type</Th>
                <Th>Group</Th>
                <Th align="right">Normal side</Th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.code}>
                  <Td className="font-mono text-xs text-slate-500">{account.code}</Td>
                  <Td>
                    {account.name}
                    {account.isSystem ? (
                      <span className="ml-2 inline-block align-middle">
                        <Pill>built-in</Pill>
                      </span>
                    ) : null}
                    {account.description ? (
                      <span className="block text-xs text-slate-500 dark:text-slate-400">
                        {account.description}
                      </span>
                    ) : null}
                  </Td>
                  <Td className="text-xs capitalize text-slate-500 dark:text-slate-400">
                    {account.type.toLowerCase()}
                  </Td>
                  <Td className="text-xs text-slate-500 dark:text-slate-400">
                    {account.group.toLowerCase().replace(/_/g, " ")}
                  </Td>
                  <Td align="right" className="text-xs">
                    {account.isContra ? "contra" : ""}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </Panel>

      <Panel title="Stock for this year">
        <div className="space-y-2 px-5 py-4 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-slate-600 dark:text-slate-300">Opening stock</span>
            <Amount value={context.adjustments.openingStock} />
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-600 dark:text-slate-300">Closing stock</span>
            <Amount value={context.adjustments.closingStock} />
          </div>
          <p className="pt-1 text-xs text-slate-500 dark:text-slate-400">
            Edit these on the{" "}
            <Link href="/books/dashboard" className="text-primary hover:underline">
              dashboard
            </Link>
            .
          </p>
        </div>
      </Panel>
    </>
  );
}
