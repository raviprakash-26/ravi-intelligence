import type { Metadata } from "next";

import { RevenueChart } from "@/components/books/revenue-chart";
import {
  Amount,
  Callout,
  ComputationNote,
  EmptyState,
  LinkButton,
  PageHeader,
  Panel,
  Pill,
  StatCard,
  Table,
  TableWrap,
  Td,
  Th,
} from "@/components/books/ui";
import { forecastRevenue, type ForecastConfidence } from "@/lib/accounting/forecast";
import { formatMonth } from "@/lib/accounting/period";
import { getAllEntries, requireFeature } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Revenue Forecast",
};

const CONFIDENCE: Record<
  ForecastConfidence,
  { label: string; tone: "green" | "amber" | "red" | "neutral" }
> = {
  none: { label: "Not enough data", tone: "neutral" },
  low: { label: "Low confidence", tone: "red" },
  moderate: { label: "Moderate confidence", tone: "amber" },
  good: { label: "Good confidence", tone: "green" },
};

export default async function ForecastPage() {
  await requireFeature("forecasting");

  // Forecasting reads the store's whole history, not just the working year —
  // one financial year is barely enough to see a trend, let alone a season.
  const entries = await getAllEntries();
  const forecast = forecastRevenue(entries, { horizonMonths: 6 });

  const confidence = CONFIDENCE[forecast.confidence];
  const monthlyTrend = forecast.model ? forecast.model.slope : 0;

  return (
    <>
      <PageHeader
        title="Revenue Forecast"
        subtitle="Where your sales are heading, based on what you have recorded so far"
      />

      {forecast.history.length === 0 ? (
        <Panel>
          <EmptyState
            title="No sales recorded yet"
            description="Record some sales and this page will show you the trend, the seasonal pattern once a couple of years are in, and a projection of the months ahead."
            action={<LinkButton href="/books/transactions/new">Record a sale</LinkButton>}
          />
        </Panel>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Months of history"
              value={String(forecast.history.length)}
              hint={
                forecast.history.length < 12
                  ? "A year makes the trend dependable"
                  : "Enough to read a trend"
              }
            />
            <StatCard
              label="Monthly trend"
              value={<Amount value={Math.round(monthlyTrend)} signed />}
              hint="Change in sales per month"
              tone={monthlyTrend >= 0 ? "positive" : "negative"}
            />
            <StatCard
              label="Average growth"
              value={
                forecast.averageGrowthRate === null
                  ? "—"
                  : `${forecast.averageGrowthRate >= 0 ? "+" : ""}${forecast.averageGrowthRate.toFixed(1)}%`
              }
              hint="Month on month"
            />
            <StatCard
              label="Next 6 months"
              value={<Amount value={forecast.projectedTotal} />}
              hint="Projected total sales"
            />
          </div>

          <Panel
            title="Sales and projection"
            actions={<Pill tone={confidence.tone}>{confidence.label}</Pill>}
          >
            <RevenueChart history={forecast.history} forecasts={forecast.forecasts} />
          </Panel>

          <Callout
            tone={forecast.confidence === "good" ? "info" : "warning"}
            title="What this says"
          >
            {forecast.narrative}
          </Callout>

          {forecast.forecasts.length > 0 ? (
            <Panel
              title="Month by month"
              description="The likely range widens the further out you look — treat the later months as a direction, not a number."
            >
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <Th>Month</Th>
                      <Th align="right">Lower</Th>
                      <Th align="right">Expected</Th>
                      <Th align="right">Upper</Th>
                      {forecast.hasSeasonality ? <Th align="right">Season</Th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.forecasts.map((point) => (
                      <tr key={point.month}>
                        <Td className="whitespace-nowrap">{formatMonth(point.month)}</Td>
                        <Td align="right" className="text-slate-500">
                          <Amount value={point.lower} showSymbol={false} />
                        </Td>
                        <Td align="right">
                          <Amount value={point.forecast} bold showSymbol={false} />
                        </Td>
                        <Td align="right" className="text-slate-500">
                          <Amount value={point.upper} showSymbol={false} />
                        </Td>
                        {forecast.hasSeasonality ? (
                          <Td align="right" className="font-mono text-xs tabular-nums">
                            {point.seasonalIndex >= 1 ? "+" : ""}
                            {((point.seasonalIndex - 1) * 100).toFixed(0)}%
                          </Td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            </Panel>
          ) : null}

          {forecast.hasSeasonality ? (
            <Panel
              title="Your seasonal pattern"
              description="How each month typically compares with the underlying trend."
            >
              <div className="grid grid-cols-2 gap-3 px-5 py-4 sm:grid-cols-3 lg:grid-cols-6">
                {Object.entries(forecast.seasonalIndices)
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([month, index]) => {
                    const swing = (index - 1) * 100;
                    return (
                      <div key={month} className="rounded-lg border border-border p-2.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatMonth(`2025-${month}`).split(" ")[0].slice(0, 3)}
                        </p>
                        <p
                          className={
                            swing >= 0
                              ? "font-mono text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400"
                              : "font-mono text-sm font-semibold tabular-nums text-red-600 dark:text-red-400"
                          }
                        >
                          {swing >= 0 ? "+" : ""}
                          {swing.toFixed(0)}%
                        </p>
                      </div>
                    );
                  })}
              </div>
            </Panel>
          ) : null}

          <Panel>
            <ComputationNote>
              The projection is a least-squares trend through your monthly net
              sales, adjusted for the seasonal pattern once two full years of
              history exist. The shaded range is roughly a 95% interval based on how
              far past months have scattered around the trend. It assumes next year
              behaves like last year — it cannot know about a new competitor, a
              festival that shifts, or a road being dug up outside your shop.
            </ComputationNote>
          </Panel>
        </>
      )}
    </>
  );
}
