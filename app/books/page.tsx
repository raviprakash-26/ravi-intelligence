import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Calculator,
  CheckCircle2,
  Landmark,
  Scale,
  ShieldCheck,
} from "lucide-react";

import { PLANS, PLAN_ORDER } from "@/lib/billing/plans";

export const metadata: Metadata = {
  title: "Books for retail stores",
  description:
    "Enter your sales, purchases and expenses in plain language. Get a journal, ledger, trial balance, final accounts, GST returns and tax estimates prepared for you.",
};

const CAPABILITIES = [
  {
    icon: BookOpen,
    title: "Journal and ledger, written for you",
    body: "Record a sale the way you'd describe it — what you sold, for how much, paid in cash or on credit. The double entry is derived from that, posted to the ledger, and every entry is checked to balance before it is saved.",
  },
  {
    icon: Scale,
    title: "Final accounts, ready to hand over",
    body: "Trial Balance, Trading Account, Profit & Loss, Balance Sheet, Receipts & Payments and Income & Expenditure — laid out the way an accountant or a bank expects to read them.",
  },
  {
    icon: Landmark,
    title: "GST worked out, not guessed",
    body: "CGST and SGST or IGST is decided from the place of supply rather than left to you. GSTR-1 and GSTR-3B summaries, with input credit set off in the statutory order so you know what to actually pay in cash.",
  },
  {
    icon: Calculator,
    title: "Income tax you can plan around",
    body: "Slab computation under both regimes with a side-by-side comparison, Section 44AD presumptive income, and your advance tax instalment dates so nothing arrives as a surprise in March.",
  },
  {
    icon: BarChart3,
    title: "Ratios and revenue trend",
    body: "Gross and net margin, current and quick ratio, stock turnover, collection period — each explained in a sentence. Plus a revenue projection that tells you honestly how much to trust it.",
  },
  {
    icon: ShieldCheck,
    title: "Your books stay yours",
    body: "Every store's data is isolated. If a subscription lapses, your books stay readable — you are never locked out of your own records.",
  },
];

export default function BooksLandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Ravi Intelligence Books
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            Your shop&apos;s accountant and auditor, running quietly in the background.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
            Enter what you sold, what you bought, the rent and the salaries. The
            journal, ledger, final accounts, GST returns and tax estimates are
            prepared from that — correctly, every time, without you needing to know
            a debit from a credit.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/books/register"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Start a free 14-day trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/books/login"
              className="inline-flex h-11 items-center rounded-lg border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Sign in to your store
            </Link>
          </div>

          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            No card needed. Built for Indian retail — rupees, lakhs and crores, GST,
            and an April-to-March financial year.
          </p>
        </div>
      </section>

      {/* Capabilities */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          What it does for you
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <h3 className="mt-3.5 text-base font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-border bg-slate-50 dark:bg-slate-900/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Plans
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Every plan starts with a 14-day trial of everything. Change or cancel
            whenever you like.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {PLAN_ORDER.map((planId) => {
              const plan = PLANS[planId];
              return (
                <div
                  key={plan.id}
                  className={
                    plan.recommended
                      ? "relative rounded-xl border-2 border-primary bg-card p-6 shadow-md"
                      : "rounded-xl border border-border bg-card p-6 shadow-sm"
                  }
                >
                  {plan.recommended ? (
                    <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Most chosen
                    </span>
                  ) : null}

                  <h3 className="text-lg font-semibold text-foreground">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {plan.tagline}
                  </p>

                  <p className="mt-4">
                    <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
                      ₹{plan.monthlyPrice.toLocaleString("en-IN")}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {" "}
                      / month
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    or ₹{plan.annualPrice.toLocaleString("en-IN")} a year — two
                    months free
                  </p>

                  <ul className="mt-5 space-y-2.5">
                    {plan.highlights.map((highlight) => (
                      <li key={highlight} className="flex gap-2.5 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span className="text-slate-600 dark:text-slate-300">
                          {highlight}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/books/register"
                    className={
                      plan.recommended
                        ? "mt-6 flex h-10 items-center justify-center rounded-lg bg-primary text-sm font-medium text-white transition-colors hover:bg-blue-700"
                        : "mt-6 flex h-10 items-center justify-center rounded-lg border border-border text-sm font-medium text-foreground transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                    }
                  >
                    Start free trial
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-slate-500 dark:text-slate-400 sm:px-6 lg:px-8">
          <p>
            Reports are prepared from what you enter and are a computation aid for
            running and planning your business. They are not a filed return, and
            statutory filings remain your responsibility — please have them
            confirmed by a practising accountant.
          </p>
          <p className="mt-3">
            <Link href="/" className="hover:text-foreground">
              ← Back to Ravi Intelligence
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
