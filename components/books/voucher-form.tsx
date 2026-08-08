"use client";

import * as React from "react";
import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { buildAccountIndex, SYSTEM_ACCOUNTS } from "@/lib/accounting/chart-of-accounts";
import { GST_STATE_CODES, stateNameForCode } from "@/lib/accounting/gst";
import { buildEntry, type Voucher } from "@/lib/accounting/journal";
import { formatPaise, rupeesToPaise } from "@/lib/accounting/money";
import { GST_RATES, type Account, type GstRate, type JournalLine } from "@/lib/accounting/types";
import { postVoucher, type VoucherFormState } from "@/lib/books/voucher-actions";
import { cn } from "@/lib/utils";

import { Field, SubmitButton } from "./auth-forms";

/* ------------------------------------------------------------------ */
/* Voucher kinds                                                       */
/* ------------------------------------------------------------------ */

type Kind = Voucher["kind"];

interface KindOption {
  kind: Kind;
  label: string;
  description: string;
  /** Amount field label, phrased for this kind. */
  amountLabel: string;
  supportsGst: boolean;
}

const KINDS: KindOption[] = [
  {
    kind: "SALE",
    label: "Sale",
    description: "Goods sold to a customer.",
    amountLabel: "Sale amount",
    supportsGst: true,
  },
  {
    kind: "PURCHASE",
    label: "Purchase",
    description: "Stock bought from a supplier.",
    amountLabel: "Purchase amount",
    supportsGst: true,
  },
  {
    kind: "EXPENSE",
    label: "Expense",
    description: "Rent, salary, electricity or any other running cost.",
    amountLabel: "Expense amount",
    supportsGst: true,
  },
  {
    kind: "RECEIPT",
    label: "Money received",
    description: "A credit customer paying you.",
    amountLabel: "Amount received",
    supportsGst: false,
  },
  {
    kind: "PAYMENT",
    label: "Money paid",
    description: "Paying a supplier what you owe.",
    amountLabel: "Amount paid",
    supportsGst: false,
  },
  {
    kind: "SALES_RETURN",
    label: "Sales return",
    description: "A customer returned goods to you.",
    amountLabel: "Value returned",
    supportsGst: true,
  },
  {
    kind: "PURCHASE_RETURN",
    label: "Purchase return",
    description: "You returned goods to a supplier.",
    amountLabel: "Value returned",
    supportsGst: true,
  },
  {
    kind: "CONTRA",
    label: "Cash ↔ bank",
    description: "Moving your own money between the till and the bank.",
    amountLabel: "Amount transferred",
    supportsGst: false,
  },
  {
    kind: "CAPITAL",
    label: "Owner's money",
    description: "Money you put in, or take out for personal use.",
    amountLabel: "Amount",
    supportsGst: false,
  },
  {
    kind: "DEPRECIATION",
    label: "Depreciation",
    description: "Wear and tear written off a fixed asset.",
    amountLabel: "Depreciation amount",
    supportsGst: false,
  },
  {
    kind: "JOURNAL",
    label: "Manual entry",
    description: "Write the debits and credits yourself.",
    amountLabel: "Amount",
    supportsGst: false,
  },
];

const STATE_OPTIONS = Object.entries(GST_STATE_CODES).sort((a, b) =>
  a[1].localeCompare(b[1])
);

/* ------------------------------------------------------------------ */
/* Form state                                                          */
/* ------------------------------------------------------------------ */

interface FormValues {
  kind: Kind;
  date: string;
  amount: string;
  narration: string;
  reference: string;
  paymentMode: "CASH" | "BANK" | "CREDIT";
  expenseAccount: string;
  fromAccount: string;
  into: "CASH" | "BANK";
  toAccount: string;
  from: "CASH" | "BANK";
  direction: "CASH_TO_BANK" | "BANK_TO_CASH";
  capitalAction: "INTRODUCE" | "WITHDRAW";
  through: "CASH" | "BANK";
  assetAccount: string;
  hasGst: boolean;
  gstRate: GstRate;
  placeOfSupply: string;
  amountIsInclusive: boolean;
  itcBlocked: boolean;
  counterpartyGstin: string;
  counterpartyName: string;
  hsnCode: string;
  invoiceNo: string;
  manualLines: Array<{ accountCode: string; debit: string; credit: string }>;
}

const EMPTY_STATE: VoucherFormState = {};

/* ------------------------------------------------------------------ */
/* Small controls                                                      */
/* ------------------------------------------------------------------ */

function Segmented<T extends string>({
  value,
  onChange,
  options,
  name,
}: {
  value: T;
  onChange: (next: T) => void;
  options: Array<{ value: T; label: string }>;
  name?: string;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-background p-1">
      {name ? <input type="hidden" name={name} value={value} /> : null}
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === option.value
              ? "bg-primary text-white"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Checkbox({
  name,
  checked,
  onChange,
  label,
  hint,
}: {
  name: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-border accent-blue-600"
      />
      <span>
        <span className="text-sm font-medium text-foreground">{label}</span>
        {hint ? (
          <span className="block text-xs text-slate-500 dark:text-slate-400">
            {hint}
          </span>
        ) : null}
      </span>
    </label>
  );
}

function Select({
  name,
  value,
  onChange,
  children,
}: {
  name: string;
  value: string;
  onChange: (next: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      id={name}
      name={name}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
    >
      {children}
    </select>
  );
}

/* ------------------------------------------------------------------ */
/* Live preview                                                        */
/* ------------------------------------------------------------------ */

/**
 * Shows the double entry that will be posted, recomputed as the form changes.
 *
 * The voucher builders are pure, so exactly the same code that will run on the
 * server runs here — the preview cannot drift from what is actually saved. This
 * is also the part that quietly teaches a shopkeeper how their own books work.
 */
function EntryPreview({
  lines,
  accountIndex,
  error,
}: {
  lines: JournalLine[];
  accountIndex: Map<string, Account>;
  error?: string;
}) {
  if (error) {
    return (
      <p className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{error}</p>
    );
  }
  if (lines.length === 0) {
    return (
      <p className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
        Fill in an amount to see the entry that will be recorded.
      </p>
    );
  }

  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
  const balanced = totalDebit === totalCredit;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="border-b border-border px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Account
            </th>
            <th className="border-b border-border px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Debit
            </th>
            <th className="border-b border-border px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Credit
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => (
            <tr key={`${line.accountCode}-${index}`}>
              <td className="border-b border-border/60 px-4 py-2">
                <span className={cn(line.credit > 0 && "pl-6")}>
                  {accountIndex.get(line.accountCode)?.name ?? line.accountCode}
                </span>
              </td>
              <td className="border-b border-border/60 px-4 py-2 text-right font-mono tabular-nums">
                {line.debit > 0 ? formatPaise(line.debit) : "—"}
              </td>
              <td className="border-b border-border/60 px-4 py-2 text-right font-mono tabular-nums">
                {line.credit > 0 ? formatPaise(line.credit) : "—"}
              </td>
            </tr>
          ))}
          <tr className="font-semibold">
            <td className="px-4 py-2">Total</td>
            <td className="px-4 py-2 text-right font-mono tabular-nums">
              {formatPaise(totalDebit)}
            </td>
            <td className="px-4 py-2 text-right font-mono tabular-nums">
              {formatPaise(totalCredit)}
            </td>
          </tr>
        </tbody>
      </table>

      <p
        className={cn(
          "flex items-center gap-1.5 px-4 py-2.5 text-xs",
          balanced
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-600 dark:text-red-400"
        )}
      >
        {balanced ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5" /> Debits and credits agree.
          </>
        ) : (
          <>
            <AlertCircle className="h-3.5 w-3.5" /> This entry does not balance.
          </>
        )}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form                                                                */
/* ------------------------------------------------------------------ */

export function VoucherForm({
  accounts,
  storeStateCode,
  today,
  financialYear,
}: {
  accounts: Account[];
  storeStateCode: string;
  today: string;
  financialYear: string;
}) {
  const [state, formAction] = useActionState(postVoucher, EMPTY_STATE);
  const formRef = React.useRef<HTMLFormElement>(null);

  const [values, setValues] = React.useState<FormValues>({
    kind: "SALE",
    date: today,
    amount: "",
    narration: "",
    reference: "",
    paymentMode: "CASH",
    expenseAccount: SYSTEM_ACCOUNTS.rent,
    fromAccount: SYSTEM_ACCOUNTS.debtors,
    into: "CASH",
    toAccount: SYSTEM_ACCOUNTS.creditors,
    from: "CASH",
    direction: "CASH_TO_BANK",
    capitalAction: "INTRODUCE",
    through: "CASH",
    assetAccount: "1400",
    hasGst: false,
    gstRate: 18,
    placeOfSupply: storeStateCode,
    amountIsInclusive: false,
    itcBlocked: false,
    counterpartyGstin: "",
    counterpartyName: "",
    hsnCode: "",
    invoiceNo: "",
    manualLines: [
      { accountCode: "", debit: "", credit: "" },
      { accountCode: "", debit: "", credit: "" },
    ],
  });

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  // Clear the entry fields after a successful post so the next transaction can
  // be typed straight away — a shopkeeper records several in a row. The date,
  // voucher kind and GST settings are deliberately kept, since the next entry
  // is usually of the same sort.
  //
  // This adjusts state during render rather than in an effect. Each success
  // carries a distinct voucher number in its message, so the comparison fires
  // exactly once per post, and React re-renders immediately without painting
  // the stale values first.
  const [handledMessage, setHandledMessage] = React.useState<string | undefined>();
  if (state.ok && state.message && state.message !== handledMessage) {
    setHandledMessage(state.message);
    setValues((previous) => ({
      ...previous,
      amount: "",
      narration: "",
      reference: "",
      counterpartyGstin: "",
      counterpartyName: "",
      hsnCode: "",
      invoiceNo: "",
      manualLines: [
        { accountCode: "", debit: "", credit: "" },
        { accountCode: "", debit: "", credit: "" },
      ],
    }));
  }

  const option = KINDS.find((candidate) => candidate.kind === values.kind)!;
  const accountIndex = React.useMemo(() => buildAccountIndex(accounts), [accounts]);

  const expenseAccounts = React.useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.type === "EXPENSE" &&
          !account.isContra &&
          account.code !== SYSTEM_ACCOUNTS.purchases
      ),
    [accounts]
  );

  const fixedAssets = React.useMemo(
    () =>
      accounts.filter(
        (account) =>
          account.group === "FIXED_ASSET" &&
          account.code !== SYSTEM_ACCOUNTS.accumulatedDepreciation
      ),
    [accounts]
  );

  // The preview runs the real voucher builders against the current form values.
  const preview = React.useMemo<{ lines: JournalLine[]; error?: string }>(() => {
    let amount = 0;
    try {
      amount = values.amount.trim() ? rupeesToPaise(values.amount) : 0;
    } catch (error) {
      return { lines: [], error: error instanceof Error ? error.message : undefined };
    }

    if (values.kind !== "JOURNAL" && amount <= 0) return { lines: [] };

    const gst =
      option.supportsGst && values.hasGst
        ? {
            rate: values.gstRate,
            placeOfSupply: values.placeOfSupply,
            amountIsInclusive: values.amountIsInclusive,
            counterpartyGstin: values.counterpartyGstin || undefined,
            counterpartyName: values.counterpartyName || undefined,
            hsnCode: values.hsnCode || undefined,
            invoiceNo: values.invoiceNo || undefined,
            itcEligible: !values.itcBlocked,
          }
        : undefined;

    const base = { date: values.date, amount, narration: values.narration || undefined };

    let voucher: Voucher;
    switch (values.kind) {
      case "SALE":
      case "PURCHASE":
      case "SALES_RETURN":
      case "PURCHASE_RETURN":
        voucher = { ...base, kind: values.kind, paymentMode: values.paymentMode, gst };
        break;
      case "EXPENSE":
        voucher = {
          ...base,
          kind: "EXPENSE",
          expenseAccount: values.expenseAccount,
          paymentMode: values.paymentMode,
          gst,
        };
        break;
      case "RECEIPT":
        voucher = {
          ...base,
          kind: "RECEIPT",
          fromAccount: values.fromAccount,
          into: values.into,
        };
        break;
      case "PAYMENT":
        voucher = { ...base, kind: "PAYMENT", toAccount: values.toAccount, from: values.from };
        break;
      case "CONTRA":
        voucher = { ...base, kind: "CONTRA", direction: values.direction };
        break;
      case "CAPITAL":
        voucher = {
          ...base,
          kind: "CAPITAL",
          action: values.capitalAction,
          through: values.through,
        };
        break;
      case "DEPRECIATION":
        voucher = { ...base, kind: "DEPRECIATION", assetAccount: values.assetAccount };
        break;
      case "JOURNAL": {
        const lines: JournalLine[] = [];
        for (const row of values.manualLines) {
          if (!row.accountCode) continue;
          const parse = (input: string) => {
            if (!input.trim()) return 0;
            try {
              return rupeesToPaise(input);
            } catch {
              return 0;
            }
          };
          const debit = parse(row.debit);
          const credit = parse(row.credit);
          if (debit === 0 && credit === 0) continue;
          lines.push({ accountCode: row.accountCode, debit, credit });
        }
        if (lines.length === 0) return { lines: [] };
        voucher = { ...base, kind: "JOURNAL", amount: 0, lines };
        break;
      }
    }

    try {
      const built = buildEntry(voucher, {
        supplierStateCode: storeStateCode,
        accountIndex,
      });
      return { lines: built.lines };
    } catch (error) {
      return { lines: [], error: error instanceof Error ? error.message : undefined };
    }
  }, [values, option.supportsGst, storeStateCode, accountIndex]);

  const interState = values.placeOfSupply !== storeStateCode;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form ref={formRef} action={formAction} className="space-y-6">
        {/* Kind */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-3 text-sm font-medium text-foreground">
            What are you recording?
          </p>
          <input type="hidden" name="kind" value={values.kind} />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {KINDS.map((candidate) => (
              <button
                key={candidate.kind}
                type="button"
                onClick={() => set("kind", candidate.kind)}
                aria-pressed={values.kind === candidate.kind}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  values.kind === candidate.kind
                    ? "border-primary bg-primary/[0.06]"
                    : "border-border hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <span className="block text-sm font-medium text-foreground">
                  {candidate.label}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-slate-500 dark:text-slate-400">
                  {candidate.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Core details */}
        <div className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Date" name="date" required errors={state.fieldErrors?.date}>
              <input
                id="date"
                name="date"
                type="date"
                required
                value={values.date}
                onChange={(event) => set("date", event.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>

            {values.kind !== "JOURNAL" ? (
              <Field
                label={option.amountLabel}
                name="amount"
                required
                errors={state.fieldErrors?.amount}
                hint={
                  values.hasGst && values.amountIsInclusive
                    ? "Including GST."
                    : values.hasGst
                      ? "Before GST."
                      : undefined
                }
              >
                <input
                  id="amount"
                  name="amount"
                  inputMode="decimal"
                  required
                  placeholder="0.00"
                  value={values.amount}
                  onChange={(event) => set("amount", event.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm tabular-nums text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </Field>
            ) : (
              <input type="hidden" name="amount" value="0" />
            )}
          </div>

          {/* Kind-specific fields */}
          {(values.kind === "SALE" ||
            values.kind === "PURCHASE" ||
            values.kind === "SALES_RETURN" ||
            values.kind === "PURCHASE_RETURN") && (
            <Field label="Settled how?" name="paymentMode">
              <Segmented
                name="paymentMode"
                value={values.paymentMode}
                onChange={(next) => set("paymentMode", next)}
                options={[
                  { value: "CASH", label: "Cash" },
                  { value: "BANK", label: "Bank / UPI" },
                  {
                    value: "CREDIT",
                    label:
                      values.kind === "SALE" || values.kind === "SALES_RETURN"
                        ? "On credit"
                        : "Supplier credit",
                  },
                ]}
              />
            </Field>
          )}

          {values.kind === "EXPENSE" && (
            <>
              <Field
                label="Which expense?"
                name="expenseAccount"
                required
                errors={state.fieldErrors?.expenseAccount}
              >
                <Select
                  name="expenseAccount"
                  value={values.expenseAccount}
                  onChange={(next) => set("expenseAccount", next)}
                >
                  {expenseAccounts.map((account) => (
                    <option key={account.code} value={account.code}>
                      {account.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Paid how?" name="paymentMode">
                <Segmented
                  name="paymentMode"
                  value={values.paymentMode}
                  onChange={(next) => set("paymentMode", next)}
                  options={[
                    { value: "CASH", label: "Cash" },
                    { value: "BANK", label: "Bank / UPI" },
                    { value: "CREDIT", label: "Not yet paid" },
                  ]}
                />
              </Field>
            </>
          )}

          {values.kind === "RECEIPT" && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Received from" name="fromAccount">
                <Select
                  name="fromAccount"
                  value={values.fromAccount}
                  onChange={(next) => set("fromAccount", next)}
                >
                  {accounts
                    .filter(
                      (account) =>
                        account.type === "ASSET" || account.type === "INCOME"
                    )
                    .map((account) => (
                      <option key={account.code} value={account.code}>
                        {account.name}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label="Into" name="into">
                <Segmented
                  name="into"
                  value={values.into}
                  onChange={(next) => set("into", next)}
                  options={[
                    { value: "CASH", label: "Cash" },
                    { value: "BANK", label: "Bank" },
                  ]}
                />
              </Field>
            </div>
          )}

          {values.kind === "PAYMENT" && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Paid to" name="toAccount">
                <Select
                  name="toAccount"
                  value={values.toAccount}
                  onChange={(next) => set("toAccount", next)}
                >
                  {accounts
                    .filter(
                      (account) =>
                        account.type === "LIABILITY" || account.type === "EXPENSE"
                    )
                    .map((account) => (
                      <option key={account.code} value={account.code}>
                        {account.name}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label="From" name="from">
                <Segmented
                  name="from"
                  value={values.from}
                  onChange={(next) => set("from", next)}
                  options={[
                    { value: "CASH", label: "Cash" },
                    { value: "BANK", label: "Bank" },
                  ]}
                />
              </Field>
            </div>
          )}

          {values.kind === "CONTRA" && (
            <Field label="Direction" name="direction">
              <Segmented
                name="direction"
                value={values.direction}
                onChange={(next) => set("direction", next)}
                options={[
                  { value: "CASH_TO_BANK", label: "Cash → Bank" },
                  { value: "BANK_TO_CASH", label: "Bank → Cash" },
                ]}
              />
            </Field>
          )}

          {values.kind === "CAPITAL" && (
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Which way?" name="capitalAction">
                <Segmented
                  name="capitalAction"
                  value={values.capitalAction}
                  onChange={(next) => set("capitalAction", next)}
                  options={[
                    { value: "INTRODUCE", label: "Money in" },
                    { value: "WITHDRAW", label: "Drawings" },
                  ]}
                />
              </Field>
              <Field label="Through" name="through">
                <Segmented
                  name="through"
                  value={values.through}
                  onChange={(next) => set("through", next)}
                  options={[
                    { value: "CASH", label: "Cash" },
                    { value: "BANK", label: "Bank" },
                  ]}
                />
              </Field>
            </div>
          )}

          {values.kind === "DEPRECIATION" && (
            <Field label="On which asset?" name="assetAccount">
              <Select
                name="assetAccount"
                value={values.assetAccount}
                onChange={(next) => set("assetAccount", next)}
              >
                {fixedAssets.map((account) => (
                  <option key={account.code} value={account.code}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {values.kind === "JOURNAL" && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Entry lines</p>
              {values.manualLines.map((row, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr]">
                  <select
                    name="lineAccount"
                    value={row.accountCode}
                    onChange={(event) => {
                      const next = [...values.manualLines];
                      next[index] = { ...row, accountCode: event.target.value };
                      set("manualLines", next);
                    }}
                    className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  >
                    <option value="">Choose account…</option>
                    {accounts.map((account) => (
                      <option key={account.code} value={account.code}>
                        {account.code} — {account.name}
                      </option>
                    ))}
                  </select>
                  <input
                    name="lineDebit"
                    inputMode="decimal"
                    placeholder="Debit"
                    value={row.debit}
                    onChange={(event) => {
                      const next = [...values.manualLines];
                      next[index] = { ...row, debit: event.target.value };
                      set("manualLines", next);
                    }}
                    className="h-10 rounded-lg border border-border bg-background px-3 font-mono text-sm tabular-nums outline-none focus:border-primary"
                  />
                  <input
                    name="lineCredit"
                    inputMode="decimal"
                    placeholder="Credit"
                    value={row.credit}
                    onChange={(event) => {
                      const next = [...values.manualLines];
                      next[index] = { ...row, credit: event.target.value };
                      set("manualLines", next);
                    }}
                    className="h-10 rounded-lg border border-border bg-background px-3 font-mono text-sm tabular-nums outline-none focus:border-primary"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  set("manualLines", [
                    ...values.manualLines,
                    { accountCode: "", debit: "", credit: "" },
                  ])
                }
                className="text-sm font-medium text-primary hover:underline"
              >
                + Add another line
              </button>
            </div>
          )}

          <Field label="Note" name="narration" hint="What was this for?">
            <input
              id="narration"
              name="narration"
              value={values.narration}
              onChange={(event) => set("narration", event.target.value)}
              placeholder={option.description}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </Field>

          <Field label="Bill or invoice number" name="reference">
            <input
              id="reference"
              name="reference"
              value={values.reference}
              onChange={(event) => set("reference", event.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </Field>
        </div>

        {/* GST */}
        {option.supportsGst && (
          <div className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-sm">
            <Checkbox
              name="hasGst"
              checked={values.hasGst}
              onChange={(next) => set("hasGst", next)}
              label="This transaction has GST"
              hint="We work out CGST + SGST or IGST from the place of supply."
            />

            {values.hasGst && (
              <div className="space-y-5 border-t border-border pt-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="GST rate" name="gstRate">
                    <Select
                      name="gstRate"
                      value={String(values.gstRate)}
                      onChange={(next) => set("gstRate", Number(next) as GstRate)}
                    >
                      {GST_RATES.map((rate) => (
                        <option key={rate} value={rate}>
                          {rate}%
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field
                    label="Place of supply"
                    name="placeOfSupply"
                    hint={
                      interState
                        ? "Different state — IGST applies."
                        : "Your own state — CGST + SGST applies."
                    }
                  >
                    <Select
                      name="placeOfSupply"
                      value={values.placeOfSupply}
                      onChange={(next) => set("placeOfSupply", next)}
                    >
                      {STATE_OPTIONS.map(([code, name]) => (
                        <option key={code} value={code}>
                          {name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <Checkbox
                  name="amountIsInclusive"
                  checked={values.amountIsInclusive}
                  onChange={(next) => set("amountIsInclusive", next)}
                  label="The amount above already includes GST"
                  hint="Tick this if you entered the counter price the customer paid."
                />

                {(values.kind === "PURCHASE" || values.kind === "EXPENSE") && (
                  <Checkbox
                    name="itcBlocked"
                    checked={values.itcBlocked}
                    onChange={(next) => set("itcBlocked", next)}
                    label="Input credit is blocked on this"
                    hint="Motor vehicles, food and beverages, staff welfare and similar items under Section 17(5). The tax becomes part of the cost instead."
                  />
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Other party's GSTIN"
                    name="counterpartyGstin"
                    errors={state.fieldErrors?.counterpartyGstin}
                    hint="Leave blank for a walk-in customer."
                  >
                    <input
                      id="counterpartyGstin"
                      name="counterpartyGstin"
                      value={values.counterpartyGstin}
                      onChange={(event) =>
                        set("counterpartyGstin", event.target.value.toUpperCase())
                      }
                      placeholder="33AABCU9603R1ZM"
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm uppercase text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </Field>

                  <Field label="Other party's name" name="counterpartyName">
                    <input
                      id="counterpartyName"
                      name="counterpartyName"
                      value={values.counterpartyName}
                      onChange={(event) => set("counterpartyName", event.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="HSN / SAC code" name="hsnCode">
                    <input
                      id="hsnCode"
                      name="hsnCode"
                      value={values.hsnCode}
                      onChange={(event) => set("hsnCode", event.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </Field>
                  <Field label="Invoice number" name="invoiceNo">
                    <input
                      id="invoiceNo"
                      name="invoiceNo"
                      value={values.invoiceNo}
                      onChange={(event) => set("invoiceNo", event.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </Field>
                </div>
              </div>
            )}
          </div>
        )}

        {state.error ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/[0.06] px-3.5 py-3 text-sm text-red-700 dark:text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        ) : null}

        {state.ok && state.message ? (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] px-3.5 py-3 text-sm text-emerald-700 dark:text-emerald-300"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{state.message}</span>
          </div>
        ) : null}

        <SubmitButton pendingLabel="Recording…">Record transaction</SubmitButton>
      </form>

      {/* Preview */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              What will be recorded
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              The double entry, worked out as you type.
            </p>
          </div>
          <EntryPreview
            lines={preview.lines}
            accountIndex={accountIndex}
            error={preview.error}
          />
        </div>

        {values.hasGst && option.supportsGst ? (
          <div className="mt-4 flex gap-2.5 rounded-lg border border-blue-500/30 bg-blue-500/[0.05] px-3.5 py-3 text-xs text-blue-900 dark:text-blue-200">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              {interState
                ? `Supply to ${stateNameForCode(values.placeOfSupply)} from your state, so IGST at ${values.gstRate}% applies.`
                : `Supply within your own state, so CGST and SGST at ${values.gstRate / 2}% each apply.`}
            </span>
          </div>
        ) : null}

        <p className="mt-4 px-1 text-xs text-slate-500 dark:text-slate-400">
          Recording into {financialYear}.
        </p>
      </aside>
    </div>
  );
}
