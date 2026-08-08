# Books — accounting for retail stores

A subscription product for shopkeepers, living under `/books`. A retailer signs
up, records what they sold, bought and spent in plain language, and the system
keeps a proper double-entry ledger behind it and prepares every statement an
accountant or auditor would ask for.

Each store is a tenant with its own login, its own chart of accounts and its own
books. No store can read another's data.

## What it produces

From a single validated journal, the system derives:

| Report | Route |
| --- | --- |
| Journal | `/books/reports/journal` |
| Ledger (T-accounts, running balance) | `/books/reports/ledger` |
| Trial Balance | `/books/reports/trial-balance` |
| Trading Account | `/books/reports/trading` |
| Profit & Loss Account | `/books/reports/profit-loss` |
| Balance Sheet | `/books/reports/balance-sheet` |
| Receipts & Payments Account | `/books/reports/receipts-payments` |
| Income & Expenditure Account | `/books/reports/income-expenditure` |
| Financial ratios | `/books/reports/ratios` |
| GSTR-1 and GSTR-3B summaries | `/books/gst` |
| Income tax planner | `/books/tax` |
| Revenue forecast | `/books/forecast` |

## Running it

Two environment variables:

```bash
# Where the SQLite file lives. Defaults to ./data/books.db
BOOKS_DATABASE_PATH=./data/books.db

# Signs session cookies. At least 32 characters, and REQUIRED in production —
# the app refuses to start a session without it rather than falling back to a
# default that would let anyone mint their own cookie.
BOOKS_SESSION_SECRET=<a long random string>
```

Generate a secret with `openssl rand -hex 32`.

```bash
npm run dev          # http://localhost:3000/books
npm test             # engine and data-layer tests (Vitest)
npx playwright test  # full browser walkthrough (Playwright)
```

The schema is applied automatically on first connection; there is no separate
migration step to run.

## Deployment note — SQLite will not persist on Netlify

This repository deploys to Netlify, where each function invocation gets an
ephemeral filesystem. **A SQLite file written there disappears**, so the books
must not be run on Netlify Functions as-is. Options, in order of least work:

1. **Host on a container or VPS with a persistent volume** (Fly.io, Railway, a
   plain VM). SQLite is a genuinely good fit at this scale — a single shop
   generates a few thousand rows a year.
2. **Move to Postgres.** `lib/db/schema.sql` is written in a portable subset for
   exactly this: `INTEGER` paise columns, `TEXT` dates, no SQLite-specific
   types. The porting work is `lib/db/client.ts` (swap `better-sqlite3` for
   `pg`) and the `?` → `$1` placeholder style in `lib/db/repository.ts`. Every
   query is already funnelled through that one file.

The marketing site and the rest of the content pages are unaffected and continue
to deploy to Netlify normally.

## How it is put together

```
lib/accounting/     Pure engine. No I/O, no framework — just arithmetic.
  money.ts          Integer paise. Never floats.
  types.ts          Accounts, entries, GST detail, periods.
  chart-of-accounts.ts
  journal.ts        Voucher → balanced double entry, plus validation.
  ledger.ts         T-accounts, balances, trial balance.
  statements.ts     Trading, P&L, Balance Sheet, R&P, I&E.
  gst.ts            Tax splits, GSTIN validation, returns, ITC set-off.
  tax.ts            Slabs by financial year, 44AD, advance tax.
  ratios.ts         Profitability, liquidity, efficiency.
  forecast.ts       OLS trend with seasonal indices.
  period.ts         Indian financial year (April–March).

lib/db/             SQLite, tenant-scoped.
lib/auth/           scrypt passwords, database-backed sessions, the DAL.
lib/billing/        Plans and feature gating.
lib/books/          Server Actions.
components/books/   UI.
app/books/          Routes. `(app)` is the signed-in shell.
proxy.ts            Optimistic redirect guard.
```

### Decisions worth knowing about

**Money is integer paise everywhere.** Floating point cannot represent 0.1
exactly, and a fraction of a paise lost on one side of an entry is a trial
balance that never ties. `allocatePaise` distributes rounding remainders so a
CGST/SGST split always sums back to the total tax.

**Nothing reaches the ledger unbalanced.** The voucher builders produce balanced
entries by construction, `validateEntry` checks them again before the write, and
the `journal_lines` table carries CHECK constraints so even a write that bypasses
the application cannot corrupt the books.

**Stock is periodic, not perpetual.** A shop without barcode-level tracking knows
its stock only from a physical count, so opening and closing stock are entered by
the retailer. Closing stock is substituted for the Stock account's balance on
both the Trading Account and the Balance Sheet, which is the textbook treatment
and keeps the two statements in agreement. Declaring opening stock also posts an
opening entry (`Dr Stock / Cr Capital`) — without it the stock would appear as an
asset with nothing funding it and the sheet would not balance.

**GST supply type is derived, never entered.** Comparing the store's state with
the place of supply is the statutory test; letting someone tick "IGST" by hand is
how mismatched returns happen. Input credit is set off in the order fixed by
Section 49A and Rule 88A, which does not change the total tax but does change how
much cash leaves the bank this month.

**Authorisation lives in the data access layer**, not in the pages. The tenant id
always comes from the session, never from a URL or a form field. `proxy.ts` only
checks for a cookie's presence to redirect early; it is a convenience, not the
security boundary.

**A lapsed subscription blocks writing, never reading.** Losing access to your
own books because a card expired would be indefensible.

## Tax figures are an aid, not a return

Slab tables are keyed by financial year in `lib/accounting/tax.ts`, so a Budget
change is a data edit rather than a logic rewrite. The planner computes tax on
business profit alone — it does not know about salary, house property, capital
gains or Chapter VI-A deductions. It is there to tell a shopkeeper roughly what
to set aside. The GST pages are likewise summaries to check figures against
before filing, and are not a substitute for reconciliation against GSTR-2B.
