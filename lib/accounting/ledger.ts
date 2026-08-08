import { addPaise, type Paise } from "./money";
import { sortEntries } from "./journal";
import { normalBalanceOf } from "./types";
import type {
  Account,
  JournalEntry,
  LedgerAccount,
  LedgerMovement,
  TrialBalance,
  TrialBalanceRow,
} from "./types";

/**
 * Signed net movement of a set of lines against an account, expressed in the
 * account's normal direction. A debit-normal account (asset, expense) grows on
 * debits; a credit-normal account grows on credits.
 */
function signedDelta(
  debit: Paise,
  credit: Paise,
  account: Account
): Paise {
  return normalBalanceOf(account.type, account.isContra) === "DEBIT"
    ? debit - credit
    : credit - debit;
}

export interface LedgerOptions {
  /** Inclusive start of the reporting window. Earlier entries form the opening balance. */
  from?: string;
  /** Inclusive end of the reporting window. */
  to?: string;
}

/**
 * Builds the ledger for a single account: the opening balance carried in from
 * before the window, every movement inside it, and a running balance.
 */
export function buildLedgerAccount(
  account: Account,
  entries: JournalEntry[],
  options: LedgerOptions = {}
): LedgerAccount {
  const { from, to } = options;
  const ordered = sortEntries(entries);

  let openingBalance: Paise = 0;
  const movements: LedgerMovement[] = [];
  let totalDebit: Paise = 0;
  let totalCredit: Paise = 0;

  for (const entry of ordered) {
    if (to && entry.date > to) continue;

    const relevant = entry.lines.filter(
      (line) => line.accountCode === account.code
    );
    if (relevant.length === 0) continue;

    const entryDebit = relevant.reduce((sum, line) => sum + line.debit, 0);
    const entryCredit = relevant.reduce((sum, line) => sum + line.credit, 0);

    if (from && entry.date < from) {
      openingBalance += signedDelta(entryDebit, entryCredit, account);
      continue;
    }

    totalDebit = addPaise(totalDebit, entryDebit);
    totalCredit = addPaise(totalCredit, entryCredit);

    const previous =
      movements.length > 0
        ? movements[movements.length - 1].runningBalance
        : openingBalance;

    movements.push({
      entryId: entry.id,
      date: entry.date,
      voucherNo: entry.voucherNo,
      voucherType: entry.voucherType,
      narration: entry.narration,
      debit: entryDebit,
      credit: entryCredit,
      runningBalance: previous + signedDelta(entryDebit, entryCredit, account),
    });
  }

  const closingBalance =
    movements.length > 0
      ? movements[movements.length - 1].runningBalance
      : openingBalance;

  return {
    account,
    openingBalance,
    movements,
    totalDebit,
    totalCredit,
    closingBalance,
  };
}

/** Builds ledgers for every account that has any activity or opening balance. */
export function buildAllLedgers(
  accounts: Account[],
  entries: JournalEntry[],
  options: LedgerOptions = {}
): LedgerAccount[] {
  return accounts
    .map((account) => buildLedgerAccount(account, entries, options))
    .filter(
      (ledger) => ledger.movements.length > 0 || ledger.openingBalance !== 0
    )
    .sort((a, b) => a.account.code.localeCompare(b.account.code));
}

/**
 * Closing balances for every account, in the account's normal direction, as of a
 * date. This is the primitive every statement is built from.
 */
export function computeBalances(
  accounts: Account[],
  entries: JournalEntry[],
  asOf?: string
): Map<string, Paise> {
  const index = new Map(accounts.map((account) => [account.code, account]));
  const balances = new Map<string, Paise>(
    accounts.map((account) => [account.code, 0])
  );

  for (const entry of entries) {
    if (asOf && entry.date > asOf) continue;
    for (const line of entry.lines) {
      const account = index.get(line.accountCode);
      if (!account) continue;
      balances.set(
        line.accountCode,
        (balances.get(line.accountCode) ?? 0) +
          signedDelta(line.debit, line.credit, account)
      );
    }
  }

  return balances;
}

/**
 * The trial balance: every account's closing balance placed on its natural side.
 *
 * `isBalanced` is the health check for the whole book. Because every entry is
 * validated as balanced before it is stored, this should never be false — if it
 * is, data has been altered outside the application and the reports below it
 * cannot be trusted.
 */
export function buildTrialBalance(
  accounts: Account[],
  entries: JournalEntry[],
  asOf: string
): TrialBalance {
  const balances = computeBalances(accounts, entries, asOf);
  const rows: TrialBalanceRow[] = [];
  let totalDebit: Paise = 0;
  let totalCredit: Paise = 0;

  for (const account of [...accounts].sort((a, b) =>
    a.code.localeCompare(b.code)
  )) {
    const balance = balances.get(account.code) ?? 0;
    if (balance === 0) continue;

    const normal = normalBalanceOf(account.type, account.isContra);
    // A negative balance means the account is sitting on the opposite side of
    // its normal one — an overdrawn bank account, for instance — so it is shown
    // on that opposite side rather than as a negative number.
    const onDebitSide = normal === "DEBIT" ? balance > 0 : balance < 0;
    const magnitude = Math.abs(balance);

    rows.push({
      account,
      debit: onDebitSide ? magnitude : 0,
      credit: onDebitSide ? 0 : magnitude,
    });

    if (onDebitSide) {
      totalDebit = addPaise(totalDebit, magnitude);
    } else {
      totalCredit = addPaise(totalCredit, magnitude);
    }
  }

  return {
    asOf,
    rows,
    totalDebit,
    totalCredit,
    isBalanced: totalDebit === totalCredit,
  };
}

/** Sums the balances of every account in a group, in normal direction. */
export function sumByGroup(
  accounts: Account[],
  balances: Map<string, Paise>,
  predicate: (account: Account) => boolean
): Paise {
  return accounts
    .filter(predicate)
    .reduce((total, account) => total + (balances.get(account.code) ?? 0), 0);
}
