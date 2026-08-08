import * as React from "react";
import Link from "next/link";

import { formatPaise, type Paise } from "@/lib/accounting/money";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Money                                                               */
/* ------------------------------------------------------------------ */

export interface AmountProps {
  value: Paise;
  /** Renders a dash instead of ₹0.00, which keeps statement columns readable. */
  dashIfZero?: boolean;
  /** Colours negatives red and positives green. Off by default — in a ledger a
   *  negative is normal, not an error, and colouring everything is noise. */
  signed?: boolean;
  showSymbol?: boolean;
  className?: string;
  bold?: boolean;
}

/**
 * Renders an amount right-aligned with tabular figures.
 *
 * Tabular numerals give every digit the same width, so columns of rupees line
 * up on the decimal point down a whole statement. Proportional digits make a
 * trial balance genuinely hard to scan.
 */
export function Amount({
  value,
  dashIfZero = false,
  signed = false,
  showSymbol = true,
  className,
  bold = false,
}: AmountProps) {
  const text = formatPaise(value, {
    symbol: showSymbol,
    showZeroAsDash: dashIfZero,
  });

  return (
    <span
      className={cn(
        "font-mono text-right tabular-nums whitespace-nowrap",
        bold && "font-semibold",
        signed && value < 0 && "text-red-600 dark:text-red-400",
        signed && value > 0 && "text-emerald-600 dark:text-emerald-400",
        className
      )}
    >
      {text}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Page furniture                                                      */
/* ------------------------------------------------------------------ */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-sm",
        className
      )}
    >
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="space-y-0.5">
            {title ? (
              <h2 className="text-base font-semibold text-foreground">{title}</h2>
            ) : null}
            {description ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {description}
              </p>
            ) : null}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "neutral" | "positive" | "negative" | "warning";
}) {
  const tones = {
    neutral: "border-border",
    positive: "border-emerald-500/30 bg-emerald-500/[0.03]",
    negative: "border-red-500/30 bg-red-500/[0.03]",
    warning: "border-amber-500/30 bg-amber-500/[0.03]",
  };

  return (
    <div className={cn("rounded-xl border bg-card p-4 shadow-sm", tones[tone])}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <div className="mt-1.5 text-xl font-semibold text-foreground">{value}</div>
      {hint ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {action}
    </div>
  );
}

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning" | "danger" | "success";
  title?: string;
  children: React.ReactNode;
}) {
  const tones = {
    info: "border-blue-500/30 bg-blue-500/[0.05] text-blue-900 dark:text-blue-200",
    warning: "border-amber-500/30 bg-amber-500/[0.05] text-amber-900 dark:text-amber-200",
    danger: "border-red-500/30 bg-red-500/[0.05] text-red-900 dark:text-red-200",
    success: "border-emerald-500/30 bg-emerald-500/[0.05] text-emerald-900 dark:text-emerald-200",
  };

  return (
    <div className={cn("rounded-lg border px-4 py-3 text-sm", tones[tone])}>
      {title ? <p className="mb-0.5 font-semibold">{title}</p> : null}
      <div className="[&_a]:underline">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tables                                                              */
/* ------------------------------------------------------------------ */

/**
 * Wraps a table so wide content scrolls inside its own box rather than pushing
 * the whole page sideways on a phone — which is where a shopkeeper will most
 * often be looking at it.
 */
export function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="w-full overflow-x-auto">{children}</div>;
}

export function Table({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <table className={cn("w-full min-w-full text-sm", className)}>{children}</table>
  );
}

export function Th({
  children,
  align = "left",
  className,
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <th
      className={cn(
        "border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  align = "left",
  className,
  colSpan,
}: {
  children?: React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        "border-b border-border/60 px-4 py-2.5 align-top text-foreground",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
    >
      {children}
    </td>
  );
}

/* ------------------------------------------------------------------ */
/* Statements                                                          */
/* ------------------------------------------------------------------ */

export interface StatementRowProps {
  label: React.ReactNode;
  amount?: Paise;
  /** A sub-item, indented under the line above. */
  indent?: boolean;
  /** A total or result line: bold, with a rule above. */
  total?: boolean;
  /** The final line of a statement: double rule, as an accountant would draw it. */
  grand?: boolean;
  note?: React.ReactNode;
}

export function StatementRow({
  label,
  amount,
  indent = false,
  total = false,
  grand = false,
  note,
}: StatementRowProps) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 px-5 py-1.5",
        indent && "pl-9",
        total && "mt-1 border-t border-border pt-2 font-semibold",
        grand && "mt-1 border-t-2 border-double border-foreground/40 pt-2 font-semibold"
      )}
    >
      <span className={cn("text-sm", !total && !grand && "text-slate-600 dark:text-slate-300")}>
        {label}
        {note ? (
          <span className="ml-1.5 text-xs text-slate-400">{note}</span>
        ) : null}
      </span>
      {amount !== undefined ? (
        <Amount value={amount} bold={total || grand} />
      ) : null}
    </div>
  );
}

/**
 * The two sides of a traditional T-account, side by side on a wide screen and
 * stacked on a phone. Accountants read Trading and P&L accounts this way, and
 * an auditor asked to check the books expects to see them in this shape.
 */
export function TAccount({
  debitTitle,
  creditTitle,
  debitSide,
  creditSide,
}: {
  debitTitle: string;
  creditTitle: string;
  debitSide: React.ReactNode;
  creditSide: React.ReactNode;
}) {
  return (
    <div className="grid gap-px bg-border md:grid-cols-2">
      <div className="bg-card">
        <div className="border-b border-border px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {debitTitle}
        </div>
        <div className="py-2">{debitSide}</div>
      </div>
      <div className="bg-card">
        <div className="border-b border-border px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {creditTitle}
        </div>
        <div className="py-2">{creditSide}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "blue" | "green" | "amber" | "red";
}) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    red: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors",
        variant === "primary"
          ? "bg-primary text-white hover:bg-blue-700"
          : "border border-border text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
      )}
    >
      {children}
    </Link>
  );
}

/** Standard footnote for figures that are an aid rather than a filed return. */
export function ComputationNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-t border-border px-5 py-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
      {children}
    </p>
  );
}
