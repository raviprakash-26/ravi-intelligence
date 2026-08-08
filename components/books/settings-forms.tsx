"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { GST_STATE_CODES } from "@/lib/accounting/gst";
import type { FinancialYear } from "@/lib/accounting/types";
import {
  switchFinancialYear,
  updateStoreSettings,
  type SettingsFormState,
} from "@/lib/books/settings-actions";

import { Field, SubmitButton } from "./auth-forms";

const EMPTY: SettingsFormState = {};

const STATE_OPTIONS = Object.entries(GST_STATE_CODES).sort((a, b) =>
  a[1].localeCompare(b[1])
);

function Feedback({ state }: { state: SettingsFormState }) {
  if (state.error) {
    return (
      <p role="alert" className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        {state.error}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p role="status" className="flex items-start gap-2 text-sm text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        {state.message}
      </p>
    );
  }
  return null;
}

export function StoreSettingsForm({
  name,
  legalName,
  gstin,
  stateCode,
  address,
  phone,
  canEdit,
}: {
  name: string;
  legalName: string | null;
  gstin: string | null;
  stateCode: string;
  address: string | null;
  phone: string | null;
  canEdit: boolean;
}) {
  const [state, formAction] = useActionState(updateStoreSettings, EMPTY);

  return (
    <form action={formAction} className="space-y-5 px-5 py-4">
      <fieldset disabled={!canEdit} className="space-y-5 disabled:opacity-60">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Store name"
            name="name"
            required
            defaultValue={name}
            errors={state.fieldErrors?.name}
          />
          <Field
            label="Legal / registered name"
            name="legalName"
            defaultValue={legalName ?? ""}
            errors={state.fieldErrors?.legalName}
          />
        </div>

        <Field
          label="State"
          name="stateCode"
          required
          errors={state.fieldErrors?.stateCode}
          hint="Changing this changes whether new sales attract CGST + SGST or IGST."
        >
          <select
            id="stateCode"
            name="stateCode"
            defaultValue={stateCode}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {STATE_OPTIONS.map(([code, stateName]) => (
              <option key={code} value={code}>
                {stateName}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="GSTIN"
          name="gstin"
          defaultValue={gstin ?? ""}
          errors={state.fieldErrors?.gstin}
          hint="Checked against its check digit and against the state above before saving."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Phone"
            name="phone"
            type="tel"
            defaultValue={phone ?? ""}
            errors={state.fieldErrors?.phone}
          />
          <Field
            label="Address"
            name="address"
            defaultValue={address ?? ""}
            errors={state.fieldErrors?.address}
          />
        </div>

        <Feedback state={state} />

        {canEdit ? (
          <div className="max-w-xs">
            <SubmitButton pendingLabel="Saving…">Save store details</SubmitButton>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Only the store owner can change these details.
          </p>
        )}
      </fieldset>
    </form>
  );
}

export function FinancialYearForm({
  current,
  options,
}: {
  current: string;
  options: FinancialYear[];
}) {
  const [state, formAction] = useActionState(switchFinancialYear, EMPTY);

  return (
    <form action={formAction} className="space-y-4 px-5 py-4">
      <Field
        label="Financial year"
        name="financialYear"
        hint="Reports and new entries apply to the year selected here. Closing stock carries forward into a new year automatically."
      >
        <select
          id="financialYear"
          name="financialYear"
          defaultValue={current}
          className="h-10 w-full max-w-xs rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {options.map((year) => (
            <option key={year.label} value={year.label}>
              {year.label} ({year.startDate} to {year.endDate})
            </option>
          ))}
        </select>
      </Field>

      <Feedback state={state} />

      <div className="max-w-xs">
        <SubmitButton pendingLabel="Switching…">Switch year</SubmitButton>
      </div>
    </form>
  );
}
