import type { Metadata } from "next";

import {
  Amount,
  Callout,
  ComputationNote,
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
import { formatPaise, type Paise } from "@/lib/accounting/money";
import { formatDate, startYearOf } from "@/lib/accounting/period";
import { buildFinancialStatements } from "@/lib/accounting/statements";
import {
  buildAdvanceTaxSchedule,
  compareRegimes,
  computePresumptiveIncome,
  DEFAULT_TAX_YEAR,
  TAX_DISCLAIMER,
  TAX_YEARS,
} from "@/lib/accounting/tax";
import { getEntries, requireFeature } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Income Tax Planner",
};

function slabRange(from: Paise, to: Paise | null): string {
  const start = formatPaise(from, { symbol: false }).split(".")[0];
  if (to === null) return `Above ₹${start}`;
  return `₹${start} – ₹${formatPaise(to, { symbol: false }).split(".")[0]}`;
}

export default async function TaxPage() {
  const context = await requireFeature("tax-planner");
  // Deliberately the working year only, unlike the balance-carrying reports.
  // Everything read below is a flow measured over the year — net profit, net
  // sales, and the scan for cash receipts further down, which would pick up
  // prior years' sales if handed the whole history.
  const entries = await getEntries(context.range);

  const statements = buildFinancialStatements(
    context.accounts,
    entries,
    context.range,
    context.adjustments
  );

  // A proprietor is taxed on the business profit, so net profit is the starting
  // point for taxable income before any personal deductions.
  const businessProfit = statements.profitAndLoss.netProfit;

  // Slabs are only configured for years the app knows about; fall back rather
  // than throwing on a store working in an unconfigured year.
  const taxYear = TAX_YEARS[context.financialYear] ? context.financialYear : DEFAULT_TAX_YEAR;

  const comparison = compareRegimes({
    taxableIncome: Math.max(0, businessProfit),
    financialYear: taxYear,
  });

  const chosen = comparison.cheaper === "NEW" ? comparison.newRegime : comparison.oldRegime;
  const schedule = buildAdvanceTaxSchedule(chosen.totalTax, startYearOf(taxYear));

  const turnover = statements.trading.netSales;

  // Receipts through bank and UPI qualify for the lower 6% presumptive rate,
  // and computePresumptiveIncome recovers the cash side by subtracting the
  // digital figure from turnover — so the two must be measured the same way.
  // They were not: netSales is taxable value with GST excluded, while a
  // settlement line is gross, carrying the GST the customer actually handed
  // over. Subtracting a gross cash figure from a net turnover understated
  // digital turnover by the GST on every cash sale, pushing income onto the
  // wrong rate and skewing the cash-share test that picks the ₹2 crore limit
  // over the ₹3 crore one.
  //
  // Each sale therefore contributes its own taxable value in proportion to how
  // much of its settlement was cash. Returns net off on the same basis, their
  // settlement sitting on the credit side rather than the debit side.
  //
  // Known limit: a credit sale later collected in cash still counts as digital.
  // Attributing it properly means tracing a receipt back to the invoice it
  // settles, which the entry model does not record.
  const cashTurnover = entries
    .filter(
      (entry) =>
        entry.voucherType === "SALE" || entry.voucherType === "SALES_RETURN"
    )
    .reduce((sum, entry) => {
      const isReturn = entry.voucherType === "SALES_RETURN";
      const settled = entry.lines.reduce(
        (total, line) => total + (isReturn ? line.credit : line.debit),
        0
      );
      if (settled === 0) return sum;

      const cash = entry.lines.reduce(
        (total, line) =>
          line.accountCode === SYSTEM_ACCOUNTS.cash
            ? total + (isReturn ? line.credit : line.debit)
            : total,
        0
      );
      if (cash === 0) return sum;

      const taxable = entry.gst ? Math.abs(entry.gst.taxableValue) : settled;
      const contribution = Math.round((taxable * cash) / settled);
      return sum + (isReturn ? -contribution : contribution);
    }, 0);

  const presumptive = computePresumptiveIncome({
    turnover,
    digitalTurnover: Math.max(0, turnover - Math.max(0, cashTurnover)),
    actualProfit: businessProfit,
  });

  return (
    <>
      <PageHeader
        title="Income Tax Planner"
        subtitle={`${TAX_YEARS[taxYear].label} · ${TAX_YEARS[taxYear].assessmentYear}`}
      />

      <Callout tone="info">{TAX_DISCLAIMER}</Callout>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Business profit"
          value={<Amount value={businessProfit} signed />}
          hint="Net profit from your Profit & Loss Account"
        />
        <StatCard
          label="Estimated tax"
          value={<Amount value={chosen.totalTax} />}
          hint={`Under the ${comparison.cheaper === "NEW" ? "new" : "old"} regime`}
          tone={chosen.totalTax > 0 ? "warning" : "positive"}
        />
        <StatCard
          label="Effective rate"
          value={`${chosen.effectiveRate.toFixed(2)}%`}
          hint="Total tax as a share of taxable income"
        />
      </div>

      {/* Regime comparison */}
      <Panel
        title="Which regime costs you less"
        description="Both computed on the same profit, so the difference is the regime alone."
      >
        <div className="grid gap-px bg-border md:grid-cols-2">
          {[comparison.newRegime, comparison.oldRegime].map((result) => {
            const isCheaper = result.regime === comparison.cheaper;
            return (
              <div key={result.regime} className="bg-card p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">
                    {result.regime === "NEW" ? "New regime" : "Old regime"}
                  </h3>
                  {isCheaper ? <Pill tone="green">Cheaper</Pill> : null}
                </div>

                <p className="mt-3 font-mono text-2xl font-semibold tabular-nums">
                  {formatPaise(result.totalTax)}
                </p>

                <dl className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500 dark:text-slate-400">Tax on income</dt>
                    <dd><Amount value={result.taxOnIncome} showSymbol={false} /></dd>
                  </div>
                  {result.rebate87A > 0 ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500 dark:text-slate-400">
                        Less: rebate u/s 87A
                      </dt>
                      <dd><Amount value={-result.rebate87A} showSymbol={false} /></dd>
                    </div>
                  ) : null}
                  {result.surcharge > 0 ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500 dark:text-slate-400">
                        Surcharge at {result.surchargeRate}%
                      </dt>
                      <dd><Amount value={result.surcharge} showSymbol={false} /></dd>
                    </div>
                  ) : null}
                  {result.marginalRelief > 0 ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500 dark:text-slate-400">
                        Marginal relief
                      </dt>
                      <dd><Amount value={-result.marginalRelief} showSymbol={false} /></dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500 dark:text-slate-400">
                      Health &amp; education cess at {result.cessRate}%
                    </dt>
                    <dd><Amount value={result.cess} showSymbol={false} /></dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-border pt-1.5 font-semibold">
                    <dt>Total</dt>
                    <dd><Amount value={result.totalTax} bold showSymbol={false} /></dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>

        {comparison.saving > 0 ? (
          <div className="border-t border-border bg-slate-50 px-5 py-3 text-sm dark:bg-slate-800/40">
            The {comparison.cheaper === "NEW" ? "new" : "old"} regime saves you{" "}
            <strong className="font-mono tabular-nums">
              {formatPaise(comparison.saving)}
            </strong>{" "}
            on this profit. The old regime can still win if you have substantial
            deductions — 80C, health insurance, home loan interest — which are not
            reflected in your books here.
          </div>
        ) : null}
      </Panel>

      {/* Slab breakdown */}
      <Panel
        title={`Slab breakdown · ${comparison.cheaper === "NEW" ? "new" : "old"} regime`}
      >
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Income slab</Th>
                <Th align="right">Rate</Th>
                <Th align="right">Income in slab</Th>
                <Th align="right">Tax</Th>
              </tr>
            </thead>
            <tbody>
              {chosen.slabs.map((slab, index) => (
                <tr key={index}>
                  <Td className="font-mono text-xs">{slabRange(slab.from, slab.to)}</Td>
                  <Td align="right">{slab.rate}%</Td>
                  <Td align="right"><Amount value={slab.incomeInSlab} showSymbol={false} /></Td>
                  <Td align="right"><Amount value={slab.tax} showSymbol={false} dashIfZero /></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </Panel>

      {/* Presumptive */}
      <Panel
        title="Presumptive taxation — Section 44AD"
        description="Declare a fixed share of turnover as profit and skip maintaining detailed books."
      >
        <div className="space-y-3 px-5 py-4 text-sm">
          {presumptive.eligible ? (
            <>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400">
                  Received through bank or UPI, at 6%
                </span>
                <Amount value={presumptive.deemedProfitDigital} />
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400">
                  Received in cash, at 8%
                </span>
                <Amount value={presumptive.deemedProfitCash} />
              </div>
              <div className="flex justify-between gap-3 border-t border-border pt-3 font-semibold">
                <span>Deemed profit</span>
                <Amount value={presumptive.deemedProfit} bold />
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400">
                  Your actual profit
                </span>
                <Amount value={businessProfit} signed />
              </div>

              {businessProfit < presumptive.deemedProfit ? (
                <Callout tone="warning">
                  Your actual profit is lower than the deemed figure. You may still
                  declare the actual profit, but doing so requires your accounts to
                  be audited under Section 44AB. Declaring the presumptive figure
                  avoids the audit at the cost of tax on profit you did not make —
                  worth discussing with your accountant.
                </Callout>
              ) : (
                <Callout tone="success">
                  Your actual profit is higher than the deemed figure, so the
                  presumptive scheme would tax you on less. Note that once you opt
                  in you are expected to stay in for five years, and opting out
                  early brings the audit requirement with it.
                </Callout>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Turnover of {formatPaise(turnover)} is within the{" "}
                {presumptive.turnoverLimit / 100 / 10000000} crore limit that applies
                to you.
              </p>
            </>
          ) : (
            <Callout tone="warning" title="Not eligible this year">
              {presumptive.reason}
            </Callout>
          )}
        </div>
      </Panel>

      {/* Advance tax */}
      {schedule.required ? (
        <Panel
          title="Advance tax instalments"
          description="Due once the year's liability crosses ₹10,000. Missing a date attracts interest under Sections 234B and 234C."
        >
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Due by</Th>
                  <Th align="right">Cumulative</Th>
                  <Th align="right">Pay by this date</Th>
                  <Th align="right">Instalment</Th>
                </tr>
              </thead>
              <tbody>
                {schedule.instalments.map((instalment) => (
                  <tr key={instalment.dueDate}>
                    <Td className="whitespace-nowrap">{formatDate(instalment.dueDate)}</Td>
                    <Td align="right">{instalment.cumulativePercent}%</Td>
                    <Td align="right"><Amount value={instalment.cumulativeAmount} showSymbol={false} /></Td>
                    <Td align="right"><Amount value={instalment.instalmentAmount} showSymbol={false} /></Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </Panel>
      ) : (
        <Panel title="Advance tax">
          <p className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
            Your estimated liability of {formatPaise(chosen.totalTax)} is below the
            ₹10,000 threshold, so advance tax instalments are not required this
            year. Keep an eye on this as trade picks up.
          </p>
        </Panel>
      )}

      <Panel>
        <ComputationNote>
          Taxable income here is your business profit alone. It does not include
          salary, house property, interest or capital gains, nor deductions under
          Chapter VI-A such as 80C, 80D or 80G — all of which will change the
          final figure. Treat this as the amount to set aside, and have the return
          itself prepared by a practising accountant.
        </ComputationNote>
      </Panel>
    </>
  );
}
