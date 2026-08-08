import { addPaise, subtractPaise, type Paise } from "./money";
import type { BalanceSheet, ProfitAndLossAccount, TradingAccount } from "./statements";

/**
 * A computed ratio. `value` is null when the denominator is zero — a store with
 * no sales has no gross profit *ratio*, and reporting 0% there would be a lie
 * rather than a missing figure.
 */
export interface Ratio {
  key: string;
  label: string;
  value: number | null;
  /** How to render: a percentage, a bare multiple (2.4:1), or a day count. */
  unit: "percent" | "times" | "days" | "ratio";
  /** Plain-language reading of what this number means for a shopkeeper. */
  interpretation: string;
  /** Rough health banding, used only for colour cues in the UI. */
  health?: "good" | "watch" | "poor";
  formula: string;
}

function divide(numerator: Paise, denominator: Paise): number | null {
  if (denominator === 0) return null;
  return numerator / denominator;
}

function percent(numerator: Paise, denominator: Paise): number | null {
  const result = divide(numerator, denominator);
  return result === null ? null : result * 100;
}

function band(
  value: number | null,
  good: number,
  watch: number,
  higherIsBetter = true
): Ratio["health"] {
  if (value === null) return undefined;
  if (higherIsBetter) {
    if (value >= good) return "good";
    if (value >= watch) return "watch";
    return "poor";
  }
  if (value <= good) return "good";
  if (value <= watch) return "watch";
  return "poor";
}

export interface RatioInputs {
  trading: TradingAccount;
  profitAndLoss: ProfitAndLossAccount;
  balanceSheet: BalanceSheet;
  /** Days in the period, used for collection and payment periods. */
  daysInPeriod: number;
  /** Credit sales, when known. Falls back to total sales. */
  creditSales?: Paise;
  /** Credit purchases, when known. Falls back to total purchases. */
  creditPurchases?: Paise;
}

/**
 * Cost of goods sold, derived rather than held in an account.
 *
 *   COGS = Opening Stock + Net Purchases + Direct Expenses − Closing Stock
 */
export function costOfGoodsSold(trading: TradingAccount): Paise {
  return subtractPaise(
    addPaise(
      trading.openingStock,
      trading.netPurchases,
      trading.totalDirectExpenses
    ),
    trading.closingStock
  );
}

export function averageStock(trading: TradingAccount): Paise {
  return Math.round((trading.openingStock + trading.closingStock) / 2);
}

/**
 * Computes the profitability, liquidity and efficiency ratios a retailer is
 * actually asked for by a bank or an auditor.
 */
export function computeRatios(inputs: RatioInputs): Ratio[] {
  const { trading, profitAndLoss, balanceSheet, daysInPeriod } = inputs;

  const netSales = trading.netSales;
  const cogs = costOfGoodsSold(trading);
  const avgStock = averageStock(trading);

  const operatingCost = addPaise(cogs, profitAndLoss.totalIndirectExpenses);
  const capitalEmployed = addPaise(
    balanceSheet.closingCapital,
    balanceSheet.totalLongTermLiabilities
  );
  const quickAssets = subtractPaise(
    balanceSheet.totalCurrentAssets,
    trading.closingStock
  );

  const debtors =
    balanceSheet.currentAssets.find((line) => line.accountCode === "1100")
      ?.amount ?? 0;
  const creditors =
    balanceSheet.currentLiabilities.find((line) => line.accountCode === "2010")
      ?.amount ?? 0;

  const creditSales = inputs.creditSales ?? netSales;
  const creditPurchases = inputs.creditPurchases ?? trading.netPurchases;

  const grossProfitRatio = percent(trading.grossProfit, netSales);
  const netProfitRatio = percent(profitAndLoss.netProfit, netSales);
  const operatingRatio = percent(operatingCost, netSales);
  const currentRatio = divide(
    balanceSheet.totalCurrentAssets,
    balanceSheet.totalCurrentLiabilities
  );
  const quickRatio = divide(quickAssets, balanceSheet.totalCurrentLiabilities);
  const stockTurnover = divide(cogs, avgStock);
  const debtorsTurnover = divide(creditSales, debtors);
  const creditorsTurnover = divide(creditPurchases, creditors);
  const roce = percent(profitAndLoss.netProfit, capitalEmployed);
  const returnOnCapital = percent(
    profitAndLoss.netProfit,
    balanceSheet.closingCapital
  );

  return [
    {
      key: "gross-profit-ratio",
      label: "Gross Profit Ratio",
      value: grossProfitRatio,
      unit: "percent",
      formula: "Gross Profit ÷ Net Sales × 100",
      interpretation:
        "The margin left after paying for the goods themselves. It has to cover rent, salaries and every other running cost before any of it is profit.",
      health: band(grossProfitRatio, 25, 15),
    },
    {
      key: "net-profit-ratio",
      label: "Net Profit Ratio",
      value: netProfitRatio,
      unit: "percent",
      formula: "Net Profit ÷ Net Sales × 100",
      interpretation:
        "What the store actually keeps out of every ₹100 of sales, after all expenses.",
      health: band(netProfitRatio, 8, 3),
    },
    {
      key: "operating-ratio",
      label: "Operating Ratio",
      value: operatingRatio,
      unit: "percent",
      formula: "(Cost of Goods Sold + Operating Expenses) ÷ Net Sales × 100",
      interpretation:
        "The share of sales consumed by running the business. Lower is better — above 100% means the store is losing money on its normal trade.",
      health: band(operatingRatio, 90, 97, false),
    },
    {
      key: "current-ratio",
      label: "Current Ratio",
      value: currentRatio,
      unit: "ratio",
      formula: "Current Assets ÷ Current Liabilities",
      interpretation:
        "Whether short-term assets can cover short-term dues. Around 2:1 is comfortable; below 1:1 means bills are due sooner than cash arrives.",
      health: band(currentRatio, 1.5, 1),
    },
    {
      key: "quick-ratio",
      label: "Quick Ratio",
      value: quickRatio,
      unit: "ratio",
      formula: "(Current Assets − Closing Stock) ÷ Current Liabilities",
      interpretation:
        "The same test but ignoring stock, which cannot always be sold quickly. 1:1 or better is the usual comfort level.",
      health: band(quickRatio, 1, 0.7),
    },
    {
      key: "stock-turnover",
      label: "Stock Turnover",
      value: stockTurnover,
      unit: "times",
      formula: "Cost of Goods Sold ÷ Average Stock",
      interpretation:
        "How many times the shelves were cleared and refilled. Higher usually means less money tied up in slow-moving stock.",
      health: band(stockTurnover, 6, 3),
    },
    {
      key: "stock-holding-days",
      label: "Stock Holding Period",
      value: stockTurnover === null || stockTurnover === 0 ? null : daysInPeriod / stockTurnover,
      unit: "days",
      formula: "Days in Period ÷ Stock Turnover",
      interpretation:
        "Average number of days an item sits on the shelf before it sells.",
      health: band(
        stockTurnover === null || stockTurnover === 0
          ? null
          : daysInPeriod / stockTurnover,
        60,
        120,
        false
      ),
    },
    {
      key: "debtors-turnover",
      label: "Debtors Turnover",
      value: debtorsTurnover,
      unit: "times",
      formula: "Credit Sales ÷ Sundry Debtors",
      interpretation:
        "How many times credit customers were collected from during the period.",
    },
    {
      key: "collection-period",
      label: "Average Collection Period",
      value:
        debtorsTurnover === null || debtorsTurnover === 0
          ? null
          : daysInPeriod / debtorsTurnover,
      unit: "days",
      formula: "Days in Period ÷ Debtors Turnover",
      interpretation:
        "How long credit customers take to pay. The longer this runs, the more of the store's cash is sitting in someone else's pocket.",
      health: band(
        debtorsTurnover === null || debtorsTurnover === 0
          ? null
          : daysInPeriod / debtorsTurnover,
        30,
        60,
        false
      ),
    },
    {
      key: "payment-period",
      label: "Average Payment Period",
      value:
        creditorsTurnover === null || creditorsTurnover === 0
          ? null
          : daysInPeriod / creditorsTurnover,
      unit: "days",
      formula: "Days in Period ÷ Creditors Turnover",
      interpretation:
        "How long the store takes to pay its suppliers. Comfortably longer than the collection period is a healthy cash cycle.",
    },
    {
      key: "return-on-capital-employed",
      label: "Return on Capital Employed",
      value: roce,
      unit: "percent",
      formula: "Net Profit ÷ (Capital + Long-term Liabilities) × 100",
      interpretation:
        "What the business earns on every rupee invested in it. Worth comparing against what the same money would earn in a fixed deposit.",
      health: band(roce, 15, 8),
    },
    {
      key: "return-on-capital",
      label: "Return on Owner's Capital",
      value: returnOnCapital,
      unit: "percent",
      formula: "Net Profit ÷ Closing Capital × 100",
      interpretation: "The owner's own return on the money left in the business.",
      health: band(returnOnCapital, 15, 8),
    },
  ];
}

/** Expense-to-sales ratio for each indirect expense, largest first. */
export function expenseRatios(
  profitAndLoss: ProfitAndLossAccount,
  netSales: Paise
): Array<{ label: string; amount: Paise; ratio: number | null }> {
  return profitAndLoss.indirectExpenses
    .map((line) => ({
      label: line.label,
      amount: line.amount,
      ratio: percent(line.amount, netSales),
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function formatRatio(ratio: Ratio): string {
  if (ratio.value === null) return "—";
  switch (ratio.unit) {
    case "percent":
      return `${ratio.value.toFixed(2)}%`;
    case "times":
      return `${ratio.value.toFixed(2)}×`;
    case "days":
      return `${Math.round(ratio.value)} days`;
    case "ratio":
      return `${ratio.value.toFixed(2)} : 1`;
  }
}
