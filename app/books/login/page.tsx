import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/books/auth-forms";
import { getSession } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Sign in to your books",
  description: "Sign in to your retail store's accounts.",
};

export default async function LoginPage() {
  // Someone already signed in has no use for the login form.
  if (await getSession()) redirect("/books/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link
            href="/books"
            className="text-xs font-semibold uppercase tracking-widest text-primary"
          >
            Ravi Intelligence Books
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
            Sign in
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Your store&apos;s books, exactly as you left them.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
