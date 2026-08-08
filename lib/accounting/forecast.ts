import { SYSTEM_ACCOUNTS } from "./chart-of-accounts";
import { type Paise } from "./money";
import type { JournalEntry } from "./types";

/**
 * Revenue trend analysis and forecasting.
 *
 * The method is ordinary least squares on monthly net sales, optionally adjusted
 * by multiplicative seasonal indices. It is deliberately simple and explainable:
 * a shopkeeper can be told "sales are growing about ₹8,000 a month, and October
 * usually runs 40% above trend", which is actionable in a way that an opaque
 * model output is not.
 */

export interface MonthlyPoint {
  /** Month key, YYYY-MM. */
  month: string;
  netSales: Paise;
}

export interface ForecastPoint {
  month: string;
  /** Central estimate. */
  forecast: Paise;
  /** Bounds of the ~95% prediction interval. */
  lower: Paise;
  upper: Paise;
  /** Seasonal index applied to the trend for this month. */
  seasonalIndex: number;
}

export interface TrendModel {
  /** Intercept, in paise, at t = 0. */
  intercept: number;
  /** Slope: change in monthly sales per month, in paise. */
  slope: number;
  /** Share of variation explained by the trend, 0 to 1. */
  rSquared: number;
  /** Standard error of the regression, in paise. */
  standardError: number;
  observations: number;
}

export type ForecastConfidence = "none" | "low" | "moderate" | "good";

export interface RevenueForecast {
  history: MonthlyPoint[];
  model: TrendModel | null;
  seasonalIndices: Record<string, number>;
  hasSeasonality: boolean;
  forecasts: ForecastPoint[];
  /** Average month-on-month growth rate, as a percentage. */
  averageGrowthRate: number | null;
  /** Total projected revenue across the forecast horizon. */
  projectedTotal: Paise;
  confidence: ForecastConfidence;
  /** Plain-language summary of what the numbers say and how far to trust them. */
  narrative: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Aggregates net sales (sales less returns) by calendar month. */
export function monthlyNetSales(
  entries: JournalEntry[],
  range?: { from: string; to: string }
): MonthlyPoint[] {
  const byMonth = new Map<string, Paise>();

  for (const entry of entries) {
    if (range && (entry.date < range.from || entry.date > range.to)) continue;
    const month = entry.date.slice(0, 7);

    for (const line of entry.lines) {
      if (line.accountCode === SYSTEM_ACCOUNTS.sales) {
        byMonth.set(month, (byMonth.get(month) ?? 0) + line.credit - line.debit);
      } else if (line.accountCode === SYSTEM_ACCOUNTS.salesReturns) {
        byMonth.set(month, (byMonth.get(month) ?? 0) - line.debit + line.credit);
      }
    }
  }

  return [...byMonth.entries()]
    .map(([month, netSales]) => ({ month, netSales }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Fills gaps in a month series with zeros.
 *
 * A month with no sales is real information — omitting it would let the
 * regression treat a closed month as if it never happened and overstate the
 * trend.
 */
export function fillMissingMonths(points: MonthlyPoint[]): MonthlyPoint[] {
  if (points.length < 2) return points;

  const filled: MonthlyPoint[] = [];
  const [startYear, startMonth] = points[0].month.split("-").map(Number);
  const last = points[points.length - 1].month;
  const known = new Map(points.map((point) => [point.month, point.netSales]));

  let year = startYear;
  let month = startMonth;
  for (let guard = 0; guard < 600; guard += 1) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    filled.push({ month: key, netSales: known.get(key) ?? 0 });
    if (key === last) break;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return filled;
}

/** Ordinary least squares fit of netSales against month index. */
export function fitTrend(points: MonthlyPoint[]): TrendModel | null {
  const n = points.length;
  if (n < 2) return null;

  const xs = points.map((_, index) => index);
  const ys = points.map((point) => point.netSales);

  const meanX = xs.reduce((sum, x) => sum + x, 0) / n;
  const meanY = ys.reduce((sum, y) => sum + y, 0) / n;

  let covariance = 0;
  let varianceX = 0;
  for (let i = 0; i < n; i += 1) {
    covariance += (xs[i] - meanX) * (ys[i] - meanY);
    varianceX += (xs[i] - meanX) ** 2;
  }

  const slope = varianceX === 0 ? 0 : covariance / varianceX;
  const intercept = meanY - slope * meanX;

  let sumSquaredError = 0;
  let sumSquaredTotal = 0;
  for (let i = 0; i < n; i += 1) {
    const predicted = intercept + slope * xs[i];
    sumSquaredError += (ys[i] - predicted) ** 2;
    sumSquaredTotal += (ys[i] - meanY) ** 2;
  }

  return {
    intercept,
    slope,
    rSquared: sumSquaredTotal === 0 ? 1 : 1 - sumSquaredError / sumSquaredTotal,
    standardError: n > 2 ? Math.sqrt(sumSquaredError / (n - 2)) : 0,
    observations: n,
  };
}

/**
 * Multiplicative seasonal indices by calendar month.
 *
 * Each month's actual is divided by its trend value, and the ratios for the same
 * calendar month are averaged. Indices are normalised to average 1 so that
 * applying them does not shift the overall level. Needs two full years to be
 * meaningful — one Diwali is an anecdote, two is a pattern.
 */
export function computeSeasonalIndices(
  points: MonthlyPoint[],
  model: TrendModel
): { indices: Record<string, number>; hasSeasonality: boolean } {
  const indices: Record<string, number> = {};
  for (let month = 1; month <= 12; month += 1) {
    indices[String(month).padStart(2, "0")] = 1;
  }

  if (points.length < 24) {
    return { indices, hasSeasonality: false };
  }

  const ratios = new Map<string, number[]>();
  points.forEach((point, index) => {
    const trend = model.intercept + model.slope * index;
    if (trend <= 0) return;
    const monthKey = point.month.slice(5, 7);
    const existing = ratios.get(monthKey) ?? [];
    existing.push(point.netSales / trend);
    ratios.set(monthKey, existing);
  });

  const raw: Record<string, number> = {};
  for (const [month, values] of ratios) {
    raw[month] = values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  const present = Object.values(raw);
  if (present.length === 0) return { indices, hasSeasonality: false };

  const mean = present.reduce((sum, value) => sum + value, 0) / present.length;
  if (mean === 0) return { indices, hasSeasonality: false };

  for (const [month, value] of Object.entries(raw)) {
    indices[month] = value / mean;
  }

  // Only claim seasonality when the swing is large enough to act on.
  const spread = Math.max(...Object.values(indices)) - Math.min(...Object.values(indices));
  return { indices, hasSeasonality: spread > 0.15 };
}

function addMonths(monthKey: string, offset: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const zeroBased = month - 1 + offset;
  const newYear = year + Math.floor(zeroBased / 12);
  const newMonth = ((zeroBased % 12) + 12) % 12;
  return `${newYear}-${String(newMonth + 1).padStart(2, "0")}`;
}

function confidenceFor(model: TrendModel | null): ForecastConfidence {
  if (!model || model.observations < 3) return "none";
  if (model.observations < 6) return "low";
  if (model.observations < 12) return model.rSquared > 0.5 ? "moderate" : "low";
  return model.rSquared > 0.6 ? "good" : "moderate";
}

function describe(
  model: TrendModel | null,
  confidence: ForecastConfidence,
  seasonalIndices: Record<string, number>,
  hasSeasonality: boolean,
  averageGrowthRate: number | null
): string {
  if (!model || confidence === "none") {
    return "There is not enough history yet to project a trend. Three or more months of sales will produce a first estimate, and about a year makes it dependable.";
  }

  const direction =
    model.slope > 0 ? "growing" : model.slope < 0 ? "declining" : "flat";
  const monthly = Math.abs(model.slope) / 100;
  const parts: string[] = [];

  if (direction === "flat") {
    parts.push("Sales are broadly flat month to month.");
  } else {
    parts.push(
      `Sales are ${direction} by about ₹${monthly.toLocaleString("en-IN", {
        maximumFractionDigits: 0,
      })} per month on trend.`
    );
  }

  if (averageGrowthRate !== null && Number.isFinite(averageGrowthRate)) {
    parts.push(
      `That is an average of ${averageGrowthRate >= 0 ? "+" : ""}${averageGrowthRate.toFixed(1)}% month on month.`
    );
  }

  parts.push(
    `The trend explains ${(model.rSquared * 100).toFixed(0)}% of the variation in monthly sales across ${model.observations} months.`
  );

  if (hasSeasonality) {
    const peak = Object.entries(seasonalIndices).sort((a, b) => b[1] - a[1])[0];
    const trough = Object.entries(seasonalIndices).sort((a, b) => a[1] - b[1])[0];
    parts.push(
      `Seasonally, ${MONTH_NAMES[Number(peak[0]) - 1]} runs about ${((peak[1] - 1) * 100).toFixed(0)}% above trend and ${MONTH_NAMES[Number(trough[0]) - 1]} about ${((1 - trough[1]) * 100).toFixed(0)}% below.`
    );
  }

  if (confidence === "low") {
    parts.push(
      "Treat this as a rough indication only — there is too little history for a reliable projection."
    );
  } else if (confidence === "moderate") {
    parts.push("Useful for planning, but expect real months to vary either side of it.");
  }

  return parts.join(" ");
}

/**
 * Projects revenue forward from the recorded sales history.
 *
 * The prediction interval widens nothing with horizon — it is a constant ±1.96
 * standard errors — which understates uncertainty far out. The horizon is
 * therefore kept short by default, and the narrative says plainly how much to
 * trust the numbers.
 */
export function forecastRevenue(
  entries: JournalEntry[],
  options: { horizonMonths?: number; range?: { from: string; to: string } } = {}
): RevenueForecast {
  const { horizonMonths = 6, range } = options;

  const history = fillMissingMonths(monthlyNetSales(entries, range));
  const model = fitTrend(history);

  const { indices, hasSeasonality } = model
    ? computeSeasonalIndices(history, model)
    : { indices: {}, hasSeasonality: false };

  const confidence = confidenceFor(model);

  // Average month-on-month growth, skipping months with a zero base.
  let averageGrowthRate: number | null = null;
  const growthRates: number[] = [];
  for (let i = 1; i < history.length; i += 1) {
    const previous = history[i - 1].netSales;
    if (previous <= 0) continue;
    growthRates.push(((history[i].netSales - previous) / previous) * 100);
  }
  if (growthRates.length > 0) {
    averageGrowthRate =
      growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
  }

  const forecasts: ForecastPoint[] = [];
  if (model && confidence !== "none" && history.length > 0) {
    const lastMonth = history[history.length - 1].month;
    const margin = 1.96 * model.standardError;

    for (let step = 1; step <= horizonMonths; step += 1) {
      const month = addMonths(lastMonth, step);
      const index = history.length - 1 + step;
      const trend = model.intercept + model.slope * index;
      const seasonalIndex = hasSeasonality ? indices[month.slice(5, 7)] ?? 1 : 1;
      const central = Math.max(0, Math.round(trend * seasonalIndex));

      forecasts.push({
        month,
        forecast: central,
        lower: Math.max(0, Math.round(central - margin)),
        upper: Math.round(central + margin),
        seasonalIndex,
      });
    }
  }

  return {
    history,
    model,
    seasonalIndices: indices,
    hasSeasonality,
    forecasts,
    averageGrowthRate,
    projectedTotal: forecasts.reduce((sum, point) => sum + point.forecast, 0),
    confidence,
    narrative: describe(
      model,
      confidence,
      indices,
      hasSeasonality,
      averageGrowthRate
    ),
  };
}

/** Trailing moving average, for smoothing a noisy sales chart. */
export function movingAverage(
  points: MonthlyPoint[],
  window = 3
): Array<{ month: string; value: number | null }> {
  return points.map((point, index) => {
    if (index < window - 1) return { month: point.month, value: null };
    const slice = points.slice(index - window + 1, index + 1);
    const total = slice.reduce((sum, item) => sum + item.netSales, 0);
    return { month: point.month, value: total / window };
  });
}
