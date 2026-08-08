import { formatMonthShort } from "@/lib/accounting/period";
import type { ForecastPoint, MonthlyPoint } from "@/lib/accounting/forecast";

/**
 * Revenue history and projection as inline SVG.
 *
 * Drawn by hand rather than with a charting library: the shapes are simple, it
 * adds no client JavaScript to a page a shopkeeper may open on a slow phone, and
 * it sidesteps the strict Content Security Policy this site sets, which blocks
 * external scripts outright.
 */

const WIDTH = 720;
const HEIGHT = 260;
const PADDING = { top: 16, right: 16, bottom: 34, left: 64 };

const PLOT_WIDTH = WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom;

/** Rupees rendered compactly for an axis: 1.2L, 45K, 2.3Cr. */
function compactRupees(paise: number): string {
  const rupees = paise / 100;
  if (Math.abs(rupees) >= 10000000) return `${(rupees / 10000000).toFixed(1)}Cr`;
  if (Math.abs(rupees) >= 100000) return `${(rupees / 100000).toFixed(1)}L`;
  if (Math.abs(rupees) >= 1000) return `${Math.round(rupees / 1000)}K`;
  return String(Math.round(rupees));
}

/** Rounds an axis maximum up to a clean number so gridlines read sensibly. */
function niceCeiling(value: number): number {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalised = value / magnitude;
  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;
  return step * magnitude;
}

export function RevenueChart({
  history,
  forecasts,
}: {
  history: MonthlyPoint[];
  forecasts: ForecastPoint[];
}) {
  const series = [
    ...history.map((point) => ({
      month: point.month,
      value: point.netSales,
      forecast: false,
      lower: point.netSales,
      upper: point.netSales,
    })),
    ...forecasts.map((point) => ({
      month: point.month,
      value: point.forecast,
      forecast: true,
      lower: point.lower,
      upper: point.upper,
    })),
  ];

  if (series.length < 2) {
    return (
      <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        At least two months of sales are needed to draw a trend.
      </p>
    );
  }

  const maxValue = niceCeiling(Math.max(...series.map((point) => point.upper), 1));
  const stepX = PLOT_WIDTH / Math.max(1, series.length - 1);

  const x = (index: number) => PADDING.left + index * stepX;
  const y = (value: number) =>
    PADDING.top + PLOT_HEIGHT - (value / maxValue) * PLOT_HEIGHT;

  const historyPath = series
    .filter((point) => !point.forecast)
    .map((point, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(point.value)}`)
    .join(" ");

  // The projection starts from the last actual point so the two lines connect.
  const forecastStart = history.length - 1;
  const forecastPath = series
    .slice(forecastStart)
    .map(
      (point, offset) =>
        `${offset === 0 ? "M" : "L"} ${x(forecastStart + offset)} ${y(point.value)}`
    )
    .join(" ");

  const bandPath =
    forecasts.length > 0
      ? [
          ...series
            .slice(forecastStart)
            .map(
              (point, offset) =>
                `${offset === 0 ? "M" : "L"} ${x(forecastStart + offset)} ${y(point.upper)}`
            ),
          ...series
            .slice(forecastStart)
            .reverse()
            .map(
              (point, offset) =>
                `L ${x(series.length - 1 - offset)} ${y(point.lower)}`
            ),
          "Z",
        ].join(" ")
      : "";

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  // On a long series, label every other month so the axis stays readable.
  const labelEvery = series.length > 14 ? Math.ceil(series.length / 10) : 1;

  return (
    <div className="w-full overflow-x-auto px-2 py-4">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full min-w-[560px]"
        role="img"
        aria-label={`Monthly net sales from ${series[0].month} to ${series[series.length - 1].month}${
          forecasts.length > 0 ? ", with a projection for the following months" : ""
        }`}
      >
        {/* Gridlines and value axis */}
        {gridLines.map((fraction) => {
          const value = maxValue * (1 - fraction);
          const lineY = PADDING.top + PLOT_HEIGHT * fraction;
          return (
            <g key={fraction}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={lineY}
                y2={lineY}
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth={1}
              />
              <text
                x={PADDING.left - 8}
                y={lineY + 4}
                textAnchor="end"
                className="fill-slate-400 text-[10px]"
              >
                {compactRupees(value)}
              </text>
            </g>
          );
        })}

        {/* Confidence band */}
        {bandPath ? (
          <path d={bandPath} className="fill-blue-500/10" />
        ) : null}

        {/* Actual */}
        <path
          d={historyPath}
          fill="none"
          className="stroke-blue-600 dark:stroke-blue-400"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Projection, dashed so it is never mistaken for recorded fact */}
        {forecasts.length > 0 ? (
          <path
            d={forecastPath}
            fill="none"
            className="stroke-blue-500/70"
            strokeWidth={2}
            strokeDasharray="5 4"
            strokeLinejoin="round"
          />
        ) : null}

        {/* Points */}
        {series.map((point, index) =>
          point.forecast ? null : (
            <circle
              key={point.month}
              cx={x(index)}
              cy={y(point.value)}
              r={3}
              className="fill-blue-600 dark:fill-blue-400"
            />
          )
        )}

        {/* Month axis */}
        {series.map((point, index) =>
          index % labelEvery === 0 || index === series.length - 1 ? (
            <text
              key={`label-${point.month}`}
              x={x(index)}
              y={HEIGHT - 12}
              textAnchor="middle"
              className={
                point.forecast
                  ? "fill-slate-400 text-[10px] italic"
                  : "fill-slate-500 text-[10px]"
              }
            >
              {formatMonthShort(point.month)}
            </text>
          ) : null
        )}
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-4 px-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 rounded bg-blue-600 dark:bg-blue-400" />
          Recorded sales
        </span>
        {forecasts.length > 0 ? (
          <>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-5 rounded bg-blue-500/70 [background-image:repeating-linear-gradient(90deg,currentColor_0_4px,transparent_4px_8px)]" />
              Projection
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-5 rounded bg-blue-500/10" />
              Likely range
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
