import type { Metadata } from "next";
import Link from "next/link";

import {
  Amount,
  Callout,
  ComputationNote,
  EmptyState,
  PageHeader,
  Panel,
  Pill,
  StatCard,
  Table,
  TableWrap,
  Td,
  Th,
} from "@/components/books/ui";
import { buildGstr1, buildGstr3b, stateNameForCode } from "@/lib/accounting/gst";
import {
  formatMonth,
  monthRange,
  monthsInFinancialYear,
  todayIso,
} from "@/lib/accounting/period";
import { getEntries, requireFeature } from "@/lib/auth/dal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "GST Returns",
};

export default async function GstPage(props: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: requestedMonth } = await props.searchParams;
  const context = await requireFeature("gst-returns");

  const months = monthsInFinancialYear(context.financialYear);
  const currentMonth = todayIso().slice(0, 7);
  const selectedMonth =
    requestedMonth && months.includes(requestedMonth)
      ? requestedMonth
      : months.includes(currentMonth)
        ? currentMonth
        : months[0];

  const range = monthRange(selectedMonth);
  const entries = await getEntries(range);

  const gstr3b = buildGstr3b(entries, range);
  const gstr1 = buildGstr1(entries, range);
  const { setOff } = gstr3b;

  const hasActivity =
    gstr3b.outwardSupplies.length > 0 || gstr3b.inwardSupplies.length > 0;

  return (
    <>
      <PageHeader
        title="GST Returns"
        subtitle={
          context.tenant.gstin
            ? `${context.tenant.gstin} · ${stateNameForCode(context.tenant.stateCode)}`
            : "No GSTIN on file — add one in Settings to file returns"
        }
      />

      {!context.tenant.gstin ? (
        <Callout tone="warning" title="Your GSTIN is not set">
          The summaries below are still computed from your entries, but you will
          need a registered GSTIN before you can file.{" "}
          <Link href="/books/settings">Add it in Settings</Link>.
        </Callout>
      ) : null}

      {/* Month picker */}
      <Panel title="Return period">
        <div className="flex flex-wrap gap-1.5 px-5 py-4">
          {months.map((month) => (
            <Link
              key={month}
              href={`/books/gst?month=${month}`}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                month === selectedMonth
                  ? "bg-primary text-white"
                  : "border border-border text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              {formatMonth(month).replace(" ", " ’").slice(0, 20)}
            </Link>
          ))}
        </div>
      </Panel>

      {!hasActivity ? (
        <Panel>
          <EmptyState
            title={`No GST transactions in ${formatMonth(selectedMonth)}`}
            description="Record a sale or purchase with GST and the return summaries will build themselves."
          />
        </Panel>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Output tax"
              value={
                <Amount
                  value={
                    gstr3b.outwardTotal.cgst +
                    gstr3b.outwardTotal.sgst +
                    gstr3b.outwardTotal.igst
                  }
                />
              }
              hint="Collected on your sales"
            />
            <StatCard
              label="Input credit"
              value={
                <Amount
                  value={
                    gstr3b.itcAvailable.cgst +
                    gstr3b.itcAvailable.sgst +
                    gstr3b.itcAvailable.igst
                  }
                />
              }
              hint="Claimable on your purchases"
            />
            <StatCard
              label="Payable in cash"
              value={<Amount value={setOff.totalCashPayable} />}
              hint="After setting off credit"
              tone={setOff.totalCashPayable > 0 ? "warning" : "positive"}
            />
            <StatCard
              label="Credit carried forward"
              value={
                <Amount
                  value={
                    setOff.creditCarriedForward.cgst +
                    setOff.creditCarriedForward.sgst +
                    setOff.creditCarriedForward.igst
                  }
                />
              }
              hint="Available next month"
            />
          </div>

          {/* GSTR-3B */}
          <Panel
            title={`GSTR-3B summary · ${formatMonth(selectedMonth)}`}
            description="Monthly summary return of outward supplies and input credit."
          >
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Rate</Th>
                    <Th align="right">Taxable value</Th>
                    <Th align="right">CGST</Th>
                    <Th align="right">SGST</Th>
                    <Th align="right">IGST</Th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-slate-50 dark:bg-slate-800/40">
                    <Td colSpan={5} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      3.1 (a) Outward taxable supplies
                    </Td>
                  </tr>
                  {gstr3b.outwardSupplies.map((bucket) => (
                    <tr key={`out-${bucket.rate}`}>
                      <Td>{bucket.rate}%</Td>
                      <Td align="right"><Amount value={bucket.taxableValue} showSymbol={false} /></Td>
                      <Td align="right"><Amount value={bucket.cgst} showSymbol={false} dashIfZero /></Td>
                      <Td align="right"><Amount value={bucket.sgst} showSymbol={false} dashIfZero /></Td>
                      <Td align="right"><Amount value={bucket.igst} showSymbol={false} dashIfZero /></Td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <Td>Total</Td>
                    <Td align="right"><Amount value={gstr3b.outwardTotal.taxableValue} bold showSymbol={false} /></Td>
                    <Td align="right"><Amount value={gstr3b.outwardTotal.cgst} bold showSymbol={false} /></Td>
                    <Td align="right"><Amount value={gstr3b.outwardTotal.sgst} bold showSymbol={false} /></Td>
                    <Td align="right"><Amount value={gstr3b.outwardTotal.igst} bold showSymbol={false} /></Td>
                  </tr>

                  <tr className="bg-slate-50 dark:bg-slate-800/40">
                    <Td colSpan={5} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      4 (A) Input tax credit available
                    </Td>
                  </tr>
                  {gstr3b.inwardSupplies.map((bucket) => (
                    <tr key={`in-${bucket.rate}`}>
                      <Td>{bucket.rate}%</Td>
                      <Td align="right"><Amount value={bucket.taxableValue} showSymbol={false} /></Td>
                      <Td align="right"><Amount value={bucket.cgst} showSymbol={false} dashIfZero /></Td>
                      <Td align="right"><Amount value={bucket.sgst} showSymbol={false} dashIfZero /></Td>
                      <Td align="right"><Amount value={bucket.igst} showSymbol={false} dashIfZero /></Td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <Td>Claimable</Td>
                    <Td align="right"><Amount value={gstr3b.itcAvailable.taxableValue} bold showSymbol={false} /></Td>
                    <Td align="right"><Amount value={gstr3b.itcAvailable.cgst} bold showSymbol={false} /></Td>
                    <Td align="right"><Amount value={gstr3b.itcAvailable.sgst} bold showSymbol={false} /></Td>
                    <Td align="right"><Amount value={gstr3b.itcAvailable.igst} bold showSymbol={false} /></Td>
                  </tr>

                  {gstr3b.itcIneligible.cgst +
                    gstr3b.itcIneligible.sgst +
                    gstr3b.itcIneligible.igst >
                  0 ? (
                    <tr className="text-slate-500 dark:text-slate-400">
                      <Td colSpan={2}>
                        4 (D) Blocked credit — not claimed
                        <span className="ml-1.5 text-xs">(Section 17(5))</span>
                      </Td>
                      <Td align="right"><Amount value={gstr3b.itcIneligible.cgst} showSymbol={false} dashIfZero /></Td>
                      <Td align="right"><Amount value={gstr3b.itcIneligible.sgst} showSymbol={false} dashIfZero /></Td>
                      <Td align="right"><Amount value={gstr3b.itcIneligible.igst} showSymbol={false} dashIfZero /></Td>
                    </tr>
                  ) : null}
                </tbody>
              </Table>
            </TableWrap>
          </Panel>

          {/* Set-off */}
          <Panel
            title="How your credit is set off"
            description="The order is fixed by law and changes how much you pay in cash today."
          >
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Credit used</Th>
                    <Th align="right">Against IGST</Th>
                    <Th align="right">Against CGST</Th>
                    <Th align="right">Against SGST</Th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <Td>IGST credit <span className="text-xs text-slate-400">used first</span></Td>
                    <Td align="right"><Amount value={setOff.utilisation.igstCredit.againstIgst} showSymbol={false} dashIfZero /></Td>
                    <Td align="right"><Amount value={setOff.utilisation.igstCredit.againstCgst} showSymbol={false} dashIfZero /></Td>
                    <Td align="right"><Amount value={setOff.utilisation.igstCredit.againstSgst} showSymbol={false} dashIfZero /></Td>
                  </tr>
                  <tr>
                    <Td>CGST credit</Td>
                    <Td align="right"><Amount value={setOff.utilisation.cgstCredit.againstIgst} showSymbol={false} dashIfZero /></Td>
                    <Td align="right"><Amount value={setOff.utilisation.cgstCredit.againstCgst} showSymbol={false} dashIfZero /></Td>
                    <Td align="right" className="text-slate-400">not allowed</Td>
                  </tr>
                  <tr>
                    <Td>SGST credit</Td>
                    <Td align="right"><Amount value={setOff.utilisation.sgstCredit.againstIgst} showSymbol={false} dashIfZero /></Td>
                    <Td align="right" className="text-slate-400">not allowed</Td>
                    <Td align="right"><Amount value={setOff.utilisation.sgstCredit.againstSgst} showSymbol={false} dashIfZero /></Td>
                  </tr>
                  <tr className="bg-slate-50 font-semibold dark:bg-slate-800/40">
                    <Td>Still payable in cash</Td>
                    <Td align="right"><Amount value={setOff.cashPayable.igst} bold showSymbol={false} dashIfZero /></Td>
                    <Td align="right"><Amount value={setOff.cashPayable.cgst} bold showSymbol={false} dashIfZero /></Td>
                    <Td align="right"><Amount value={setOff.cashPayable.sgst} bold showSymbol={false} dashIfZero /></Td>
                  </tr>
                </tbody>
              </Table>
            </TableWrap>

            <ComputationNote>
              IGST credit must be exhausted before any CGST or SGST credit is used,
              and CGST credit can never discharge SGST liability or the reverse —
              they go to different governments. This does not change the total tax,
              only how much leaves your bank this month.
            </ComputationNote>
          </Panel>

          {/* GSTR-1 */}
          <Panel
            title={`GSTR-1 summary · ${formatMonth(selectedMonth)}`}
            description="Outward supplies. Registered buyers are reported invoice by invoice; everyone else as rate-wise totals."
          >
            {gstr1.b2b.length > 0 ? (
              <>
                <p className="px-5 pt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Table 4 · B2B invoices
                </p>
                <TableWrap>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Invoice</Th>
                        <Th>Buyer GSTIN</Th>
                        <Th>Place of supply</Th>
                        <Th align="right">Rate</Th>
                        <Th align="right">Taxable</Th>
                        <Th align="right">Tax</Th>
                        <Th align="right">Invoice value</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstr1.b2b.map((invoice, index) => (
                        <tr key={`${invoice.invoiceNo}-${index}`}>
                          <Td>
                            <span className="font-mono text-xs">{invoice.invoiceNo}</span>
                            {invoice.counterpartyName ? (
                              <span className="block text-xs text-slate-500">
                                {invoice.counterpartyName}
                              </span>
                            ) : null}
                          </Td>
                          <Td><span className="font-mono text-xs">{invoice.counterpartyGstin}</span></Td>
                          <Td className="text-xs">{invoice.placeOfSupplyName}</Td>
                          <Td align="right">{invoice.rate}%</Td>
                          <Td align="right"><Amount value={invoice.taxableValue} showSymbol={false} /></Td>
                          <Td align="right">
                            <Amount
                              value={invoice.cgst + invoice.sgst + invoice.igst}
                              showSymbol={false}
                            />
                          </Td>
                          <Td align="right"><Amount value={invoice.invoiceValue} showSymbol={false} /></Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              </>
            ) : null}

            {gstr1.b2cSummary.length > 0 ? (
              <>
                <p className="px-5 pt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tables 5 &amp; 7 · B2C summary
                </p>
                <TableWrap>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Rate</Th>
                        <Th align="right">Invoices</Th>
                        <Th align="right">Taxable value</Th>
                        <Th align="right">CGST</Th>
                        <Th align="right">SGST</Th>
                        <Th align="right">IGST</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstr1.b2cSummary.map((bucket) => (
                        <tr key={`b2c-${bucket.rate}`}>
                          <Td>{bucket.rate}%</Td>
                          <Td align="right" className="font-mono tabular-nums">{bucket.invoiceCount}</Td>
                          <Td align="right"><Amount value={bucket.taxableValue} showSymbol={false} /></Td>
                          <Td align="right"><Amount value={bucket.cgst} showSymbol={false} dashIfZero /></Td>
                          <Td align="right"><Amount value={bucket.sgst} showSymbol={false} dashIfZero /></Td>
                          <Td align="right"><Amount value={bucket.igst} showSymbol={false} dashIfZero /></Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              </>
            ) : null}

            {gstr1.hsnSummary.length > 0 ? (
              <>
                <p className="px-5 pt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Table 12 · HSN summary
                </p>
                <TableWrap>
                  <Table>
                    <thead>
                      <tr>
                        <Th>HSN / SAC</Th>
                        <Th align="right">Rate</Th>
                        <Th align="right">Taxable value</Th>
                        <Th align="right">Total tax</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstr1.hsnSummary.map((row) => (
                        <tr key={`${row.hsnCode}-${row.rate}`}>
                          <Td><span className="font-mono text-xs">{row.hsnCode}</span></Td>
                          <Td align="right">{row.rate}%</Td>
                          <Td align="right"><Amount value={row.taxableValue} showSymbol={false} /></Td>
                          <Td align="right">
                            <Amount value={row.cgst + row.sgst + row.igst} showSymbol={false} />
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              </>
            ) : (
              <p className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                No HSN codes recorded this month. Add them on your sales entries and
                the Table 12 summary will fill in — it is required on B2B invoices.
              </p>
            )}

            <ComputationNote>
              These are summaries prepared from what you recorded, to check your
              figures against before filing on the GST portal. They are not a filed
              return, and they do not replace reconciliation against GSTR-2B.
              {gstr1.b2b.length > 0 ? (
                <>
                  {" "}
                  Note that B2B invoice detail must match what your buyer reports,
                  or their credit will not flow.
                </>
              ) : null}
            </ComputationNote>
          </Panel>

          {gstr3b.outwardTotal.igst > 0 && gstr3b.outwardTotal.cgst > 0 ? (
            <Callout tone="info" title="You made both intra-state and inter-state supplies">
              <Pill tone="blue">CGST + SGST</Pill> applied within{" "}
              {stateNameForCode(context.tenant.stateCode)}, and <Pill tone="blue">IGST</Pill>{" "}
              on supplies to other states. Which one applies was decided from the
              place of supply on each entry.
            </Callout>
          ) : null}
        </>
      )}
    </>
  );
}
