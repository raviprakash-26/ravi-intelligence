import { CASH_AND_BANK_CODES, SYSTEM_ACCOUNTS } from "./chart-of-accounts";
import { computeBalances } from "./ledger";
import { addPaise, subtractPaise, type Paise } from "./money";
import type {
  Account,
  DateRange,
  JournalEntry,
  PeriodAdjustments,
  StatementLine,
} from "./types";

/**
 * Movement in an income or expense account over a window.
 *
 * Nominal accounts are period figures, not balances: the Trading and P&L
 * accounts need what happened between two dates, so activity before `from` is
 * excluded rather than carried forward the way a real account balance would be.
 */
function periodActivity(
  accounts: Account[],
  entries: JournalEntry[],
  range: DateRange
): Map<string, Paise> {
  const windowed = entries.filter(
    (entry) => entry.date >= range.from && entry.date <= range.to
  );
  return computeBalances(accounts, windowed);
}

function balanceOf(balances: Map<string, Paise>, code: string): Paise {
  return balances.get(code) ?? 0;
}

function linesForGroup(
  accounts: Account[],
  balances: Map<string, Paise>,
  predicate: (account: Account) => boolean
): StatementLine[] {
  return accounts
    .filter(predicate)
    .map((account) => ({
      label: account.name,
      accountCode: account.code,
      amount: balanceOf(balances, account.code),
    }))
    .filter((line) => line.amount !== 0)
    .sort((a, b) => (a.accountCode ?? "").localeCompare(b.accountCode ?? ""));
}

function sumLines(lines: StatementLine[]): Paise {
  return lines.reduce((total, line) => total + line.amount, 0);
}

/* ------------------------------------------------------------------ */
/* Trading Account                                                     */
/* ------------------------------------------------------------------ */

export interface TradingAccount {
  range: DateRange;
  /** Debit side. */
  openingStock: Paise;
  purchases: Paise;
  purchaseReturns: Paise;
  netPurchases: Paise;
  directExpenses: StatementLine[];
  totalDirectExpenses: Paise;
  /** Credit side. */
  sales: Paise;
  salesReturns: Paise;
  netSales: Paise;
  closingStock: Paise;
  /** Positive is gross profit, negative is gross loss. */
  grossProfit: Paise;
  totalDebitSide: Paise;
  totalCreditSide: Paise;
}

/**
 * Trading Account: the gross result of buying and selling goods.
 *
 *   Gross Profit = (Net Sales + Closing Stock)
 *                − (Opening Stock + Net Purchases + Direct Expenses)
 *
 * Stock is periodic — the opening and closing figures come from the retailer's
 * physical count, not from journal entries — which is how a shop without a
 * barcode-level inventory system actually keeps its books.
 */
export function buildTradingAccount(
  accounts: Account[],
  entries: JournalEntry[],
  range: DateRange,
  adjustments: PeriodAdjustments
): TradingAccount {
  const activity = periodActivity(accounts, entries, range);

  const sales = balanceOf(activity, SYSTEM_ACCOUNTS.sales);
  const salesReturns = balanceOf(activity, SYSTEM_ACCOUNTS.salesReturns);
  const purchases = balanceOf(activity, SYSTEM_ACCOUNTS.purchases);
  const purchaseReturns = balanceOf(activity, SYSTEM_ACCOUNTS.purchaseReturns);

  const netSales = subtractPaise(sales, salesReturns);
  const netPurchases = subtractPaise(purchases, purchaseReturns);

  // Purchases and their returns are shown on their own lines above, so they are
  // excluded here to avoid counting the same rupee twice.
  const directExpenses = linesForGroup(
    accounts,
    activity,
    (account) =>
      account.group === "DIRECT_EXPENSE" &&
      account.code !== SYSTEM_ACCOUNTS.purchases &&
      account.code !== SYSTEM_ACCOUNTS.purchaseReturns
  );
  const totalDirectExpenses = sumLines(directExpenses);

  const debitSide = addPaise(
    adjustments.openingStock,
    netPurchases,
    totalDirectExpenses
  );
  const creditSide = addPaise(netSales, adjustments.closingStock);
  const grossProfit = subtractPaise(creditSide, debitSide);

  return {
    range,
    openingStock: adjustments.openingStock,
    purchases,
    purchaseReturns,
    netPurchases,
    directExpenses,
    totalDirectExpenses,
    sales,
    salesReturns,
    netSales,
    closingStock: adjustments.closingStock,
    grossProfit,
    // Both sides of a T-account are shown equal, with the result balancing it.
    totalDebitSide: grossProfit > 0 ? addPaise(debitSide, grossProfit) : debitSide,
    totalCreditSide:
      grossProfit < 0 ? addPaise(creditSide, -grossProfit) : creditSide,
  };
}

/* ------------------------------------------------------------------ */
/* Profit & Loss Account                                               */
/* ------------------------------------------------------------------ */

export interface ProfitAndLossAccount {
  range: DateRange;
  grossProfit: Paise;
  indirectIncomes: StatementLine[];
  totalIndirectIncome: Paise;
  indirectExpenses: StatementLine[];
  totalIndirectExpenses: Paise;
  /** Positive is net profit, negative is net loss. */
  netProfit: Paise;
  totalDebitSide: Paise;
  totalCreditSide: Paise;
}

/**
 * Profit & Loss Account: gross profit adjusted for everything that is not part
 * of the cost of goods — salaries, rent, depreciation, other income.
 */
export function buildProfitAndLoss(
  accounts: Account[],
  entries: JournalEntry[],
  range: DateRange,
  grossProfit: Paise
): ProfitAndLossAccount {
  const activity = periodActivity(accounts, entries, range);

  const indirectIncomes = linesForGroup(
    accounts,
    activity,
    (account) => account.group === "INDIRECT_INCOME"
  );
  const indirectExpenses = linesForGroup(
    accounts,
    activity,
    (account) => account.group === "INDIRECT_EXPENSE"
  );

  const totalIndirectIncome = sumLines(indirectIncomes);
  const totalIndirectExpenses = sumLines(indirectExpenses);

  const creditSide = addPaise(
    grossProfit > 0 ? grossProfit : 0,
    totalIndirectIncome
  );
  const debitSide = addPaise(
    grossProfit < 0 ? -grossProfit : 0,
    totalIndirectExpenses
  );
  const netProfit = subtractPaise(creditSide, debitSide);

  return {
    range,
    grossProfit,
    indirectIncomes,
    totalIndirectIncome,
    indirectExpenses,
    totalIndirectExpenses,
    netProfit,
    totalDebitSide: netProfit > 0 ? addPaise(debitSide, netProfit) : debitSide,
    totalCreditSide:
      netProfit < 0 ? addPaise(creditSide, -netProfit) : creditSide,
  };
}

/* ------------------------------------------------------------------ */
/* Balance Sheet                                                       */
/* ------------------------------------------------------------------ */

export interface BalanceSheet {
  asOf: string;
  fixedAssets: StatementLine[];
  accumulatedDepreciation: Paise;
  netFixedAssets: Paise;
  currentAssets: StatementLine[];
  totalCurrentAssets: Paise;
  totalAssets: Paise;

  openingCapital: Paise;
  netProfit: Paise;
  drawings: Paise;
  closingCapital: Paise;
  longTermLiabilities: StatementLine[];
  totalLongTermLiabilities: Paise;
  currentLiabilities: StatementLine[];
  totalCurrentLiabilities: Paise;
  totalLiabilitiesAndCapital: Paise;

  /** True when assets equal liabilities plus capital, to the paise. */
  isBalanced: boolean;
  difference: Paise;
}

/**
 * Balance Sheet as at a date.
 *
 * Closing stock is substituted for the Stock account's journal balance: under
 * periodic inventory the Stock account still carries the *opening* figure at
 * period end, and the counted closing figure is what belongs on the statement.
 * The same substitution is made on the Trading Account, so the two agree and the
 * sheet balances.
 */
export function buildBalanceSheet(
  accounts: Account[],
  entries: JournalEntry[],
  asOf: string,
  adjustments: PeriodAdjustments,
  netProfit: Paise
): BalanceSheet {
  const balances = computeBalances(accounts, entries, asOf);

  const fixedAssets = linesForGroup(
    accounts,
    balances,
    (account) =>
      account.group === "FIXED_ASSET" &&
      account.code !== SYSTEM_ACCOUNTS.accumulatedDepreciation
  );
  const accumulatedDepreciation = balanceOf(
    balances,
    SYSTEM_ACCOUNTS.accumulatedDepreciation
  );
  const netFixedAssets = subtractPaise(
    sumLines(fixedAssets),
    accumulatedDepreciation
  );

  const currentAssets = linesForGroup(
    accounts,
    balances,
    (account) =>
      account.group === "CURRENT_ASSET" &&
      account.code !== SYSTEM_ACCOUNTS.closingStock
  );
  if (adjustments.closingStock !== 0) {
    currentAssets.push({
      label: "Closing Stock",
      accountCode: SYSTEM_ACCOUNTS.closingStock,
      amount: adjustments.closingStock,
    });
    currentAssets.sort((a, b) =>
      (a.accountCode ?? "").localeCompare(b.accountCode ?? "")
    );
  }
  const totalCurrentAssets = sumLines(currentAssets);
  const totalAssets = addPaise(netFixedAssets, totalCurrentAssets);

  const openingCapital = addPaise(
    balanceOf(balances, SYSTEM_ACCOUNTS.capital),
    balanceOf(balances, SYSTEM_ACCOUNTS.retainedEarnings)
  );
  const drawings = balanceOf(balances, SYSTEM_ACCOUNTS.drawings);
  const closingCapital = subtractPaise(
    addPaise(openingCapital, netProfit),
    drawings
  );

  const longTermLiabilities = linesForGroup(
    accounts,
    balances,
    (account) => account.group === "LONG_TERM_LIABILITY"
  );
  const currentLiabilities = linesForGroup(
    accounts,
    balances,
    (account) => account.group === "CURRENT_LIABILITY"
  );

  const totalLongTermLiabilities = sumLines(longTermLiabilities);
  const totalCurrentLiabilities = sumLines(currentLiabilities);
  const totalLiabilitiesAndCapital = addPaise(
    closingCapital,
    totalLongTermLiabilities,
    totalCurrentLiabilities
  );

  const difference = subtractPaise(totalAssets, totalLiabilitiesAndCapital);

  return {
    asOf,
    fixedAssets,
    accumulatedDepreciation,
    netFixedAssets,
    currentAssets,
    totalCurrentAssets,
    totalAssets,
    openingCapital,
    netProfit,
    drawings,
    closingCapital,
    longTermLiabilities,
    totalLongTermLiabilities,
    currentLiabilities,
    totalCurrentLiabilities,
    totalLiabilitiesAndCapital,
    isBalanced: difference === 0,
    difference,
  };
}

/* ------------------------------------------------------------------ */
/* Receipts & Payments Account                                         */
/* ------------------------------------------------------------------ */

export interface CashFlowLine {
  label: string;
  accountCode: string;
  amount: Paise;
}

export interface ReceiptsAndPayments {
  range: DateRange;
  openingCash: Paise;
  openingBank: Paise;
  openingBalance: Paise;
  receipts: CashFlowLine[];
  totalReceipts: Paise;
  payments: CashFlowLine[];
  totalPayments: Paise;
  closingCash: Paise;
  closingBank: Paise;
  closingBalance: Paise;
}

/**
 * Receipts & Payments Account: a pure summary of the cash book, on a cash basis.
 *
 * Every rupee that entered or left cash and bank is grouped by the account on
 * the other side of the entry. Transfers between cash and bank are excluded —
 * moving money from the till to the bank is not a receipt or a payment, and
 * including it would inflate both totals by the same amount.
 */
export function buildReceiptsAndPayments(
  accounts: Account[],
  entries: JournalEntry[],
  range: DateRange
): ReceiptsAndPayments {
  const index = new Map(accounts.map((account) => [account.code, account]));
  const cashCodes = new Set(CASH_AND_BANK_CODES);

  const opening = computeBalances(
    accounts,
    entries.filter((entry) => entry.date < range.from)
  );
  const openingCash = balanceOf(opening, SYSTEM_ACCOUNTS.cash);
  const openingBank = balanceOf(opening, SYSTEM_ACCOUNTS.bank);

  const receipts = new Map<string, Paise>();
  const payments = new Map<string, Paise>();
  let cashMovement: Paise = 0;
  let bankMovement: Paise = 0;

  for (const entry of entries) {
    if (entry.date < range.from || entry.date > range.to) continue;

    const fundLines = entry.lines.filter((line) => cashCodes.has(line.accountCode));
    if (fundLines.length === 0) continue;

    // Fund movements are tracked for every entry, including internal transfers:
    // moving cash to the bank changes the split between the two even though it
    // is neither a receipt nor a payment.
    for (const line of fundLines) {
      const delta = line.debit - line.credit;
      if (line.accountCode === SYSTEM_ACCOUNTS.cash) cashMovement += delta;
      else bankMovement += delta;
    }

    const otherLines = entry.lines.filter(
      (line) => !cashCodes.has(line.accountCode)
    );
    // An entry touching only cash and bank is an internal transfer, so it
    // contributes nothing to receipts or payments.
    if (otherLines.length === 0) continue;

    for (const line of otherLines) {
      // The counterpart is credited when funds come in, debited when they go out.
      if (line.credit > 0) {
        receipts.set(
          line.accountCode,
          (receipts.get(line.accountCode) ?? 0) + line.credit
        );
      }
      if (line.debit > 0) {
        payments.set(
          line.accountCode,
          (payments.get(line.accountCode) ?? 0) + line.debit
        );
      }
    }
  }

  const toLines = (map: Map<string, Paise>): CashFlowLine[] =>
    [...map.entries()]
      .filter(([, amount]) => amount !== 0)
      .map(([code, amount]) => ({
        label: index.get(code)?.name ?? code,
        accountCode: code,
        amount,
      }))
      .sort((a, b) => a.accountCode.localeCompare(b.accountCode));

  const receiptLines = toLines(receipts);
  const paymentLines = toLines(payments);

  return {
    range,
    openingCash,
    openingBank,
    openingBalance: addPaise(openingCash, openingBank),
    receipts: receiptLines,
    totalReceipts: sumLines(receiptLines),
    payments: paymentLines,
    totalPayments: sumLines(paymentLines),
    closingCash: addPaise(openingCash, cashMovement),
    closingBank: addPaise(openingBank, bankMovement),
    closingBalance: addPaise(
      openingCash,
      openingBank,
      cashMovement,
      bankMovement
    ),
  };
}

/* ------------------------------------------------------------------ */
/* Income & Expenditure Account                                        */
/* ------------------------------------------------------------------ */

export interface IncomeAndExpenditure {
  range: DateRange;
  incomes: StatementLine[];
  totalIncome: Paise;
  expenditures: StatementLine[];
  totalExpenditure: Paise;
  /** Positive is a surplus, negative is a deficit. */
  surplus: Paise;
}

/**
 * Income & Expenditure Account: revenue income against revenue expenditure on an
 * accrual basis, giving a surplus or deficit.
 *
 * Unlike Receipts & Payments this ignores when cash moved, and unlike the
 * Trading Account it makes no distinction between direct and indirect items. The
 * stock movement is included so that for a trading business the surplus equals
 * the net profit — the two statements are different presentations of the same
 * period, and they should agree.
 */
export function buildIncomeAndExpenditure(
  accounts: Account[],
  entries: JournalEntry[],
  range: DateRange,
  adjustments: PeriodAdjustments
): IncomeAndExpenditure {
  const activity = periodActivity(accounts, entries, range);

  const incomes = linesForGroup(
    accounts,
    activity,
    (account) => account.type === "INCOME" && !account.isContra
  );
  const salesReturns = balanceOf(activity, SYSTEM_ACCOUNTS.salesReturns);
  if (salesReturns !== 0) {
    incomes.push({
      label: "Less: Sales Returns",
      accountCode: SYSTEM_ACCOUNTS.salesReturns,
      amount: -salesReturns,
    });
  }

  const expenditures = linesForGroup(
    accounts,
    activity,
    (account) => account.type === "EXPENSE" && !account.isContra
  );
  const purchaseReturns = balanceOf(activity, SYSTEM_ACCOUNTS.purchaseReturns);
  if (purchaseReturns !== 0) {
    expenditures.push({
      label: "Less: Purchase Returns",
      accountCode: SYSTEM_ACCOUNTS.purchaseReturns,
      amount: -purchaseReturns,
    });
  }

  // Stock movement converts purchases into cost of goods actually consumed.
  const stockMovement = subtractPaise(
    adjustments.closingStock,
    adjustments.openingStock
  );
  if (stockMovement !== 0) {
    expenditures.push({
      label:
        stockMovement > 0
          ? "Less: Increase in Stock"
          : "Add: Decrease in Stock",
      amount: -stockMovement,
    });
  }

  const totalIncome = sumLines(incomes);
  const totalExpenditure = sumLines(expenditures);

  return {
    range,
    incomes,
    totalIncome,
    expenditures,
    totalExpenditure,
    surplus: subtractPaise(totalIncome, totalExpenditure),
  };
}

/* ------------------------------------------------------------------ */
/* One-shot report set                                                 */
/* ------------------------------------------------------------------ */

export interface FinancialStatements {
  trading: TradingAccount;
  profitAndLoss: ProfitAndLossAccount;
  balanceSheet: BalanceSheet;
  receiptsAndPayments: ReceiptsAndPayments;
  incomeAndExpenditure: IncomeAndExpenditure;
}

/**
 * Builds the full statement set for a period in one pass, so the Trading
 * Account's gross profit and the P&L's net profit flow through to the Balance
 * Sheet without a caller having to wire them together correctly.
 */
export function buildFinancialStatements(
  accounts: Account[],
  entries: JournalEntry[],
  range: DateRange,
  adjustments: PeriodAdjustments
): FinancialStatements {
  const trading = buildTradingAccount(accounts, entries, range, adjustments);
  const profitAndLoss = buildProfitAndLoss(
    accounts,
    entries,
    range,
    trading.grossProfit
  );
  const balanceSheet = buildBalanceSheet(
    accounts,
    entries,
    range.to,
    adjustments,
    profitAndLoss.netProfit
  );
  const receiptsAndPayments = buildReceiptsAndPayments(accounts, entries, range);
  const incomeAndExpenditure = buildIncomeAndExpenditure(
    accounts,
    entries,
    range,
    adjustments
  );

  return {
    trading,
    profitAndLoss,
    balanceSheet,
    receiptsAndPayments,
    incomeAndExpenditure,
  };
}
