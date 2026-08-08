"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Calculator,
  ClipboardList,
  LayoutDashboard,
  Landmark,
  LogOut,
  Menu,
  Percent,
  PlusCircle,
  Scale,
  Settings,
  Store,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { logout } from "@/lib/books/auth-actions";
import type { FeatureKey } from "@/lib/billing/plans";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** When set, the item is dimmed and marked locked if the plan lacks it. */
  feature?: FeatureKey;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    label: "Daily",
    items: [
      { href: "/books/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/books/transactions/new", label: "Record transaction", icon: PlusCircle },
      { href: "/books/transactions", label: "All transactions", icon: ClipboardList },
    ],
  },
  {
    label: "Books",
    items: [
      { href: "/books/reports/journal", label: "Journal", icon: BookOpen },
      { href: "/books/reports/ledger", label: "Ledger", icon: BookOpen },
      { href: "/books/reports/trial-balance", label: "Trial Balance", icon: Scale },
    ],
  },
  {
    label: "Final accounts",
    items: [
      { href: "/books/reports/trading", label: "Trading A/c", icon: Store },
      { href: "/books/reports/profit-loss", label: "Profit & Loss", icon: TrendingUp },
      { href: "/books/reports/balance-sheet", label: "Balance Sheet", icon: Scale },
      { href: "/books/reports/receipts-payments", label: "Receipts & Payments", icon: Wallet },
      { href: "/books/reports/income-expenditure", label: "Income & Expenditure", icon: BookOpen },
    ],
  },
  {
    label: "Analysis",
    items: [
      { href: "/books/reports/ratios", label: "Ratios", icon: Percent, feature: "ratios" },
      { href: "/books/forecast", label: "Revenue forecast", icon: BarChart3, feature: "forecasting" },
    ],
  },
  {
    label: "Compliance",
    items: [
      { href: "/books/gst", label: "GST returns", icon: Landmark, feature: "gst-returns" },
      { href: "/books/tax", label: "Income tax", icon: Calculator, feature: "tax-planner" },
    ],
  },
];

function NavLink({
  item,
  locked,
  onNavigate,
}: {
  item: NavItem;
  locked: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const Icon = item.icon;

  // `/books/transactions` must not light up while on `/books/transactions/new`,
  // so the longer path wins by requiring an exact match on the list route.
  const active =
    pathname === item.href ||
    (item.href !== "/books/transactions" && pathname.startsWith(`${item.href}/`));

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-primary/10 font-medium text-primary"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {locked ? (
        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-700 dark:text-slate-400">
          Plan
        </span>
      ) : null}
    </Link>
  );
}

export function BooksNav({
  storeName,
  userName,
  planName,
  availableFeatures,
}: {
  storeName: string;
  userName: string;
  planName: string;
  availableFeatures: FeatureKey[];
}) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // Close the drawer on navigation, otherwise it stays open over the new page.
  // Adjusted during render rather than in an effect so the drawer never paints
  // over the destination for a frame first. This also covers back and forward,
  // which a click handler on the links would miss.
  const [lastPathname, setLastPathname] = React.useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  const isLocked = (item: NavItem) =>
    Boolean(item.feature && !availableFeatures.includes(item.feature));

  const content = (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-4">
        <p className="truncate text-sm font-semibold text-foreground">{storeName}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
          {userName} · {planName}
        </p>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {group.label}
            </p>
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} locked={isLocked(item)} />
            ))}
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-border px-3 py-3">
        <NavLink
          item={{ href: "/books/settings", label: "Settings", icon: Settings }}
          locked={false}
        />
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
        <p className="truncate text-sm font-semibold">{storeName}</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-card shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3.5 z-10 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
            {content}
          </div>
        </div>
      ) : null}

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:sticky lg:top-0 lg:block lg:h-screen">
        {content}
      </aside>
    </>
  );
}
