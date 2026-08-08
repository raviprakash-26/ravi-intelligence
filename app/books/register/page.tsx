import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/books/auth-forms";
import { getSession } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Set up your store's books",
  description:
    "Create your store account and start recording sales, purchases and expenses.",
};

export default async function RegisterPage() {
  if (await getSession()) redirect("/books/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/books"
            className="text-xs font-semibold uppercase tracking-widest text-primary"
          >
            Ravi Intelligence Books
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            Set up your store
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Fourteen days of everything, no card needed. Your chart of accounts is
            created for you.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
