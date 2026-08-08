import type { Metadata } from "next";

import { PlanPicker } from "@/components/books/plan-picker";
import { Callout, ComputationNote, PageHeader, Panel } from "@/components/books/ui";
import { getBooksContext } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Plans",
};

export default async function PlanPage(props: {
  searchParams: Promise<{ locked?: string }>;
}) {
  const { locked } = await props.searchParams;
  const context = await getBooksContext();

  return (
    <>
      <PageHeader
        title="Plans"
        subtitle="Change whenever you like. Your books are never affected by the plan you are on."
      />

      {context.subscription.readOnly ? (
        <Callout tone="warning" title="Entries are paused">
          {context.subscription.message} Everything you have already recorded stays
          exactly where it is and remains readable.
        </Callout>
      ) : null}

      <PlanPicker
        currentPlan={context.tenant.plan}
        canChange={context.user.role === "OWNER"}
        lockedFeature={locked}
      />

      <Panel>
        <ComputationNote>
          No payment gateway is connected in this deployment, so choosing a plan
          records the change and activates it immediately. Connecting a gateway
          would move that decision to a webhook from the payment provider rather
          than a button here.
        </ComputationNote>
      </Panel>
    </>
  );
}
