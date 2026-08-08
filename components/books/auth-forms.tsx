"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, ArrowRight } from "lucide-react";

import { GST_STATE_CODES } from "@/lib/accounting/gst";
import { login, registerStore, type AuthFormState } from "@/lib/books/auth-actions";
import { cn } from "@/lib/utils";

const STATE_OPTIONS = Object.entries(GST_STATE_CODES).sort((a, b) =>
  a[1].localeCompare(b[1])
);

export function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
  errors,
  hint,
  autoComplete,
  children,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  errors?: string[];
  hint?: string;
  autoComplete?: string;
  children?: React.ReactNode;
}) {
  const errorId = `${name}-error`;
  const hasError = Boolean(errors?.length);

  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-foreground">
        {label}
        {!required ? (
          <span className="ml-1.5 text-xs font-normal text-slate-400">optional</span>
        ) : null}
      </label>

      {children ?? (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          defaultValue={defaultValue}
          autoComplete={autoComplete}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          className={cn(
            "h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground outline-none transition-colors",
            "focus:border-primary focus:ring-2 focus:ring-primary/20",
            hasError ? "border-red-500" : "border-border"
          )}
        />
      )}

      {hint && !hasError ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}

      {hasError ? (
        <ul id={errorId} className="space-y-0.5">
          {errors!.map((error) => (
            <li key={error} className="text-xs text-red-600 dark:text-red-400">
              {error}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Submit button that reflects the pending state of the enclosing form.
 *
 * `useFormStatus` must be read from a child of the form, which is why this is a
 * separate component rather than a flag in the parent.
 */
export function SubmitButton({
  children,
  pendingLabel,
}: {
  children: React.ReactNode;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
    >
      {pending ? pendingLabel : children}
      {!pending ? <ArrowRight className="h-4 w-4" /> : null}
    </button>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/[0.06] px-3.5 py-3 text-sm text-red-700 dark:text-red-300"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

const EMPTY: AuthFormState = {};

export function LoginForm() {
  const [state, formAction] = useActionState(login, EMPTY);

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state.error} />

      <Field
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
      />

      <Field
        label="Password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        errors={state.fieldErrors?.password}
      />

      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        New here?{" "}
        <Link href="/books/register" className="font-medium text-primary hover:underline">
          Set up your store
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState(registerStore, EMPTY);

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state.error} />

      <Field
        label="Store name"
        name="storeName"
        required
        placeholder="Anand Provision Stores"
        defaultValue={state.values?.storeName}
        errors={state.fieldErrors?.storeName}
      />

      <Field
        label="Your name"
        name="ownerName"
        required
        autoComplete="name"
        placeholder="Anand Kumar"
        defaultValue={state.values?.ownerName}
        errors={state.fieldErrors?.ownerName}
      />

      <Field
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
      />

      <Field
        label="Password"
        name="password"
        type="password"
        required
        autoComplete="new-password"
        hint="At least 10 characters, with a letter and a number."
        errors={state.fieldErrors?.password}
      />

      <Field
        label="State"
        name="stateCode"
        required
        errors={state.fieldErrors?.stateCode}
        hint="Decides whether your sales attract CGST + SGST or IGST."
      >
        <select
          id="stateCode"
          name="stateCode"
          required
          defaultValue={state.values?.stateCode ?? "33"}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {STATE_OPTIONS.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="GSTIN"
        name="gstin"
        placeholder="33AABCU9603R1ZM"
        defaultValue={state.values?.gstin}
        errors={state.fieldErrors?.gstin}
        hint="Leave blank if you are not registered. We check it before saving."
      />

      <Field
        label="Phone"
        name="phone"
        type="tel"
        autoComplete="tel"
        defaultValue={state.values?.phone}
        errors={state.fieldErrors?.phone}
      />

      <SubmitButton pendingLabel="Setting up your books…">
        Create my store
      </SubmitButton>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Already set up?{" "}
        <Link href="/books/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
