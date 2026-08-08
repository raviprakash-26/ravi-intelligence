import Link from "next/link";

import { BooksNav } from "@/components/books/nav";
import { Callout } from "@/components/books/ui";
import { getBooksContext } from "@/lib/auth/dal";

/**
 * Shell for the signed-in application.
 *
 * The layout resolves the session so the sidebar can show the store name, but
 * it is not the security boundary: layouts do not re-render on every navigation
 * under partial rendering, so each page and every Server Action performs its own
 * check through the data access layer.
 */
export default async function BooksAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getBooksContext();

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <BooksNav
        storeName={context.tenant.name}
        userName={context.user.name}
        planName={context.plan.name}
        availableFeatures={context.plan.features}
      />

      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          {context.subscription.message ? (
            <Callout tone={context.subscription.readOnly ? "warning" : "info"}>
              {context.subscription.message}{" "}
              <Link href="/books/settings/plan" className="font-medium">
                View plans
              </Link>
            </Callout>
          ) : null}

          {children}
        </div>
      </main>
    </div>
  );
}
