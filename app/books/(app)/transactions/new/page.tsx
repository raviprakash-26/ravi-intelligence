import type { Metadata } from "next";

import { PageHeader } from "@/components/books/ui";
import { VoucherForm } from "@/components/books/voucher-form";
import { todayIso } from "@/lib/accounting/period";
import { getBooksContext } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Record a transaction",
};

export default async function NewTransactionPage() {
  const context = await getBooksContext();

  // A date outside the working year would be rejected on save, so default the
  // field to a date that is actually inside it.
  const today = todayIso();
  const defaultDate =
    today > context.range.to ? context.range.to : today < context.range.from ? context.range.from : today;

  return (
    <>
      <PageHeader
        title="Record a transaction"
        subtitle="Describe what happened. The debits and credits are worked out for you."
      />

      <VoucherForm
        accounts={context.accounts}
        storeStateCode={context.tenant.stateCode}
        today={defaultDate}
        financialYear={context.financialYear}
      />
    </>
  );
}
