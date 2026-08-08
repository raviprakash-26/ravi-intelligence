import { SYSTEM_ACCOUNTS } from "./chart-of-accounts";
import { computeBalances } from "./ledger";
import { addPaise, subtractPaise, type Paise } from "./money";
import { normalBalanceOf } from "./types";
import type {
  Account,
  DateRange,
  JournalEntry,
  JournalLine,
  PeriodAdjustments,
} from "./types";

/**
 * The year-end close.
 *
 * Income and expense accounts measure a single year and mean nothing carried
 * forward, so at year end they are emptied into Retained Earnings and the next
 * year starts from zero. Without this the profit of a finished year is stranded
 * in accounts no statement of position reports, while the cash and stock it
 * produced sit on the Balance Sheet with nothing on the other side — the sheet
 * then fails to balance by exactly last year's profit, and no entry the
 * shopkeeper can make will fix it.
 *
 * The closing entry is an ordinary balanced journal entry, posted on the last
 * day of the year with voucher type CLOSING. Nothing about it is special-cased
 * in the ledger; only the statements know to treat it differently, and only
 * because activity and position want opposite things from it.
 */

/** The closing entry already posted for a period, if the year has been closed. */
export function findClosingEntry(
  entries: JournalEntry[],
  range: DateRange
): JournalEntry | undefined {
  return entries.find(
    (entry) =>
      entry.voucherType === "CLOSING" &&
      entry.date >= range.from &&
      entry.date <= range.to
  );
}

/** True when the period has been closed and its nominal accounts emptied. */
export function isPeriodClosed(
  entries: JournalEntry[],
  range: DateRange
): boolean {
  return findClosingEntry(entries, range) !== undefined;
}

/**
 * Entries excluding any closing entry posted inside the window.
 *
 * Anything measuring what the business *did* over the year has to look past the
 * close, or a closed year reports nil sales and nil profit.
 */
export function withoutClosingEntries(
  entries: JournalEntry[],
  range: DateRange
): JournalEntry[] {
  return entries.filter(
    (entry) =>
      !(
        entry.voucherType === "CLOSING" &&
        entry.date >= range.from &&
        entry.date <= range.to
      )
  );
}

/**
 * How much a set of entries moved Retained Earnings, in the account's normal
 * (credit) direction. Used by the Balance Sheet to avoid counting a year's
 * profit twice once it has been closed.
 */
export function retainedEarningsMovement(entries: JournalEntry[]): Paise {
  return entries.reduce((total, entry) => {
    const lines = entry.lines.filter(
      (line) => line.accountCode === SYSTEM_ACCOUNTS.retainedEarnings
    );
    return lines.reduce(
      (running, line) => running + line.credit - line.debit,
      total
    );
  }, 0);
}

/**
 * A line that returns an account to zero.
 *
 * `computeBalances` reports a balance in the account's own normal direction, so
 * emptying it means posting the same magnitude on the opposite side. A negative
 * balance — an account sitting the wrong way round, which happens legitimately
 * with contra accounts — flips the side again.
 */
function zeroingLine(account: Account, signedBalance: Paise): JournalLine | null {
  if (signedBalance === 0) return null;

  const normal = normalBalanceOf(account.type, account.isContra);
  const onDebitSide =
    normal === "CREDIT" ? signedBalance > 0 : signedBalance < 0;
  const magnitude = Math.abs(signedBalance);

  return onDebitSide
    ? { accountCode: account.code, debit: magnitude, credit: 0 }
    : { accountCode: account.code, debit: 0, credit: magnitude };
}

export interface ClosingPlan {
  /** The balanced set of lines to post. */
  lines: JournalLine[];
  /** Profit transferred to Retained Earnings — the P&L's figure, unchanged. */
  netProfit: Paise;
  /** Movement applied to the Stock account to bring it to the counted figure. */
  stockAdjustment: Paise;
  /** Nominal accounts emptied by this entry. */
  accountsClosed: number;
}

export type ClosingResult =
  | { ok: true; plan: ClosingPlan }
  | { ok: false; reason: string };

/**
 * Builds the closing entry for a period.
 *
 * `netProfit` is taken from the P&L rather than recomputed, so the figure
 * transferred to Retained Earnings is by construction the figure the statements
 * report. The two must agree; if they cannot, the books are internally
 * inconsistent and this refuses rather than posting an entry that papers over
 * it.
 *
 * Three things happen at once:
 *
 *  1. Every income and expense account is emptied.
 *  2. The Stock account is moved from whatever it carries — the opening figure,
 *     under periodic inventory — to the counted closing figure. The Balance
 *     Sheet already substitutes the counted figure when it reports, but the
 *     ledger has to agree with it before the year is put away, and this is also
 *     what makes next year's opening stock right.
 *  3. The balance, which is the year's profit, goes to Retained Earnings.
 */
export function buildClosingPlan(options: {
  accounts: Account[];
  /** The store's whole history. Windowed internally. */
  entries: JournalEntry[];
  range: DateRange;
  adjustments: PeriodAdjustments;
  /** Net profit as reported by the P&L for this same period. */
  netProfit: Paise;
}): ClosingResult {
  const { accounts, entries, range, adjustments, netProfit } = options;

  if (isPeriodClosed(entries, range)) {
    return { ok: false, reason: "This year has already been closed." };
  }

  const open = withoutClosingEntries(entries, range);

  // Nominal accounts measure the year alone, so only this year's movement is
  // emptied — not the cumulative balance, which for a second year would sweep
  // up a previous year's trading as well.
  const activity = computeBalances(
    accounts,
    open.filter((entry) => entry.date >= range.from && entry.date <= range.to)
  );

  const lines: JournalLine[] = [];
  let accountsClosed = 0;

  for (const account of [...accounts].sort((a, b) =>
    a.code.localeCompare(b.code)
  )) {
    if (account.type !== "INCOME" && account.type !== "EXPENSE") continue;

    const line = zeroingLine(account, activity.get(account.code) ?? 0);
    if (line) {
      lines.push(line);
      accountsClosed += 1;
    }
  }

  // Stock is cumulative, so this one is read as a running balance rather than as
  // the year's movement.
  const stockOnLedger =
    computeBalances(accounts, open, range.to).get(SYSTEM_ACCOUNTS.closingStock) ??
    0;
  const stockAdjustment = subtractPaise(adjustments.closingStock, stockOnLedger);

  if (stockAdjustment !== 0) {
    lines.push(
      stockAdjustment > 0
        ? {
            accountCode: SYSTEM_ACCOUNTS.closingStock,
            debit: stockAdjustment,
            credit: 0,
          }
        : {
            accountCode: SYSTEM_ACCOUNTS.closingStock,
            debit: 0,
            credit: -stockAdjustment,
          }
    );
  }

  if (netProfit !== 0) {
    lines.push(
      netProfit > 0
        ? {
            accountCode: SYSTEM_ACCOUNTS.retainedEarnings,
            debit: 0,
            credit: netProfit,
          }
        : {
            accountCode: SYSTEM_ACCOUNTS.retainedEarnings,
            debit: -netProfit,
            credit: 0,
          }
    );
  }

  if (lines.length === 0) {
    return { ok: false, reason: "There is nothing to close in this year yet." };
  }

  const totalDebit = lines.reduce((sum, line) => addPaise(sum, line.debit), 0);
  const totalCredit = lines.reduce((sum, line) => addPaise(sum, line.credit), 0);

  if (totalDebit !== totalCredit) {
    // Reaching here means the reported profit and the ledger disagree. The
    // usual cause is an opening stock declared in settings but never posted as
    // an entry, which the Balance Sheet already reports as an out-of-balance
    // figure. Closing on top of that would bury the discrepancy in Retained
    // Earnings, where it would be far harder to find.
    return {
      ok: false,
      reason:
        "The books do not balance for this year, so it cannot be closed yet. " +
        "Check the Balance Sheet — an opening stock entered in Settings but " +
        "never recorded in the ledger is the usual cause.",
    };
  }

  return {
    ok: true,
    plan: { lines, netProfit, stockAdjustment, accountsClosed },
  };
}
