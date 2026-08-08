import "server-only";

import { DEFAULT_CHART_OF_ACCOUNTS } from "@/lib/accounting/chart-of-accounts";
import { validateEntry } from "@/lib/accounting/journal";
import type {
  Account,
  GstDetail,
  JournalEntry,
  JournalLine,
  PeriodAdjustments,
  VoucherType,
} from "@/lib/accounting/types";
import type { Paise } from "@/lib/accounting/money";

import { getDatabase, newId, nowIso, transaction } from "./client";

/* ------------------------------------------------------------------ */
/* Row shapes                                                          */
/* ------------------------------------------------------------------ */

export type PlanId = "TRIAL" | "STARTER" | "PROFESSIONAL" | "BUSINESS";
export type SubscriptionStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELLED";
export type UserRole = "OWNER" | "ACCOUNTANT" | "STAFF";

export interface Tenant {
  id: string;
  name: string;
  legalName: string | null;
  gstin: string | null;
  pan: string | null;
  stateCode: string;
  address: string | null;
  phone: string | null;
  financialYear: string;
  plan: PlanId;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string | null;
}

interface UserWithSecret extends User {
  passwordHash: string;
  passwordSalt: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  tenantId: string;
  expiresAt: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Mappers                                                             */
/* ------------------------------------------------------------------ */

/* eslint-disable @typescript-eslint/no-explicit-any */

function toTenant(row: any): Tenant {
  return {
    id: row.id,
    name: row.name,
    legalName: row.legal_name,
    gstin: row.gstin,
    pan: row.pan,
    stateCode: row.state_code,
    address: row.address,
    phone: row.phone,
    financialYear: row.financial_year,
    plan: row.plan,
    subscriptionStatus: row.subscription_status,
    trialEndsAt: row.trial_ends_at,
    createdAt: row.created_at,
  };
}

function toUser(row: any): User {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  };
}

function toAccount(row: any): Account {
  return {
    code: row.code,
    name: row.name,
    type: row.type,
    group: row.account_group,
    isContra: row.is_contra === 1,
    isSystem: row.is_system === 1,
    description: row.description ?? undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Tenants                                                             */
/* ------------------------------------------------------------------ */

export function createTenant(input: {
  name: string;
  stateCode: string;
  financialYear: string;
  gstin?: string | null;
  pan?: string | null;
  legalName?: string | null;
  phone?: string | null;
  address?: string | null;
}): Tenant {
  const db = getDatabase();
  const id = newId("ten");
  const createdAt = nowIso();
  // Fourteen days from signup, so a shopkeeper can enter a full fortnight of
  // trade before deciding whether the product earns its subscription.
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    `INSERT INTO tenants
       (id, name, legal_name, gstin, pan, state_code, address, phone,
        financial_year, plan, subscription_status, trial_ends_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'TRIAL', 'TRIALING', ?, ?)`
  ).run(
    id,
    input.name,
    input.legalName ?? null,
    input.gstin ?? null,
    input.pan ?? null,
    input.stateCode,
    input.address ?? null,
    input.phone ?? null,
    input.financialYear,
    trialEndsAt,
    createdAt
  );

  return getTenant(id)!;
}

export function getTenant(id: string): Tenant | null {
  const row = getDatabase().prepare(`SELECT * FROM tenants WHERE id = ?`).get(id);
  return row ? toTenant(row) : null;
}

export function updateTenant(
  id: string,
  patch: Partial<
    Pick<
      Tenant,
      | "name"
      | "legalName"
      | "gstin"
      | "pan"
      | "stateCode"
      | "address"
      | "phone"
      | "financialYear"
      | "plan"
      | "subscriptionStatus"
    >
  >
): Tenant | null {
  const columns: Record<string, string> = {
    name: "name",
    legalName: "legal_name",
    gstin: "gstin",
    pan: "pan",
    stateCode: "state_code",
    address: "address",
    phone: "phone",
    financialYear: "financial_year",
    plan: "plan",
    subscriptionStatus: "subscription_status",
  };

  const assignments: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(patch)) {
    const column = columns[key];
    if (!column || value === undefined) continue;
    assignments.push(`${column} = ?`);
    values.push(value);
  }
  if (assignments.length === 0) return getTenant(id);

  values.push(id);
  getDatabase()
    .prepare(`UPDATE tenants SET ${assignments.join(", ")} WHERE id = ?`)
    .run(...values);

  return getTenant(id);
}

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

export function createUser(input: {
  tenantId: string;
  email: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
  role?: UserRole;
}): User {
  const db = getDatabase();
  const id = newId("usr");

  db.prepare(
    `INSERT INTO users
       (id, tenant_id, email, password_hash, password_salt, name, role, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.tenantId,
    input.email.toLowerCase(),
    input.passwordHash,
    input.passwordSalt,
    input.name,
    input.role ?? "OWNER",
    nowIso()
  );

  return getUser(id)!;
}

export function getUser(id: string): User | null {
  const row = getDatabase().prepare(`SELECT * FROM users WHERE id = ?`).get(id);
  return row ? toUser(row) : null;
}

/** Returns the password material alongside the user. Never expose to a client. */
export function findUserByEmailWithSecret(email: string): UserWithSecret | null {
  const row: any = getDatabase()
    .prepare(`SELECT * FROM users WHERE email = ?`)
    .get(email.toLowerCase());
  if (!row) return null;
  return {
    ...toUser(row),
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
  };
}

export function emailExists(email: string): boolean {
  const row = getDatabase()
    .prepare(`SELECT 1 AS present FROM users WHERE email = ?`)
    .get(email.toLowerCase());
  return Boolean(row);
}

export function recordLogin(userId: string): void {
  getDatabase()
    .prepare(`UPDATE users SET last_login_at = ? WHERE id = ?`)
    .run(nowIso(), userId);
}

export function listUsers(tenantId: string): User[] {
  return getDatabase()
    .prepare(`SELECT * FROM users WHERE tenant_id = ? ORDER BY created_at`)
    .all(tenantId)
    .map(toUser);
}

/* ------------------------------------------------------------------ */
/* Sessions                                                            */
/* ------------------------------------------------------------------ */

export function createSession(input: {
  userId: string;
  tenantId: string;
  expiresAt: string;
  userAgent?: string;
}): SessionRecord {
  const db = getDatabase();
  const id = newId("ses");

  db.prepare(
    `INSERT INTO sessions (id, user_id, tenant_id, expires_at, created_at, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.userId,
    input.tenantId,
    input.expiresAt,
    nowIso(),
    input.userAgent ?? null
  );

  return {
    id,
    userId: input.userId,
    tenantId: input.tenantId,
    expiresAt: input.expiresAt,
    createdAt: nowIso(),
  };
}

/**
 * Looks up a live session. Expired rows are treated as absent and deleted, so
 * an old cookie cannot be replayed even if the signature still verifies.
 */
export function getLiveSession(id: string): SessionRecord | null {
  const db = getDatabase();
  const row: any = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id);
  if (!row) return null;

  if (row.expires_at <= nowIso()) {
    db.prepare(`DELETE FROM sessions WHERE id = ?`).run(id);
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    tenantId: row.tenant_id,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export function deleteSession(id: string): void {
  getDatabase().prepare(`DELETE FROM sessions WHERE id = ?`).run(id);
}

export function deleteSessionsForUser(userId: string): void {
  getDatabase().prepare(`DELETE FROM sessions WHERE user_id = ?`).run(userId);
}

export function purgeExpiredSessions(): number {
  return getDatabase()
    .prepare(`DELETE FROM sessions WHERE expires_at <= ?`)
    .run(nowIso()).changes;
}

/* ------------------------------------------------------------------ */
/* Accounts                                                            */
/* ------------------------------------------------------------------ */

/** Copies the default chart of accounts into a newly created store. */
export function seedChartOfAccounts(tenantId: string): void {
  const db = getDatabase();
  const insert = db.prepare(
    `INSERT OR IGNORE INTO accounts
       (tenant_id, code, name, type, account_group, is_contra, is_system, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  transaction(() => {
    for (const account of DEFAULT_CHART_OF_ACCOUNTS) {
      insert.run(
        tenantId,
        account.code,
        account.name,
        account.type,
        account.group,
        account.isContra ? 1 : 0,
        account.isSystem ? 1 : 0,
        account.description ?? null
      );
    }
  });
}

export function listAccounts(tenantId: string): Account[] {
  return getDatabase()
    .prepare(`SELECT * FROM accounts WHERE tenant_id = ? ORDER BY code`)
    .all(tenantId)
    .map(toAccount);
}

export function getAccount(tenantId: string, code: string): Account | null {
  const row = getDatabase()
    .prepare(`SELECT * FROM accounts WHERE tenant_id = ? AND code = ?`)
    .get(tenantId, code);
  return row ? toAccount(row) : null;
}

export function createAccount(tenantId: string, account: Account): void {
  getDatabase()
    .prepare(
      `INSERT INTO accounts
         (tenant_id, code, name, type, account_group, is_contra, is_system, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      tenantId,
      account.code,
      account.name,
      account.type,
      account.group,
      account.isContra ? 1 : 0,
      0,
      account.description ?? null
    );
}

/** Deletes a custom account. System accounts and used accounts are protected. */
export function deleteAccount(
  tenantId: string,
  code: string
): { deleted: boolean; reason?: string } {
  const db = getDatabase();
  const account = getAccount(tenantId, code);
  if (!account) return { deleted: false, reason: "Account not found." };
  if (account.isSystem) {
    return {
      deleted: false,
      reason: "This is a built-in account and the reports depend on it.",
    };
  }

  const used: any = db
    .prepare(
      `SELECT COUNT(*) AS count FROM journal_lines
        WHERE tenant_id = ? AND account_code = ?`
    )
    .get(tenantId, code);

  if (used.count > 0) {
    return {
      deleted: false,
      reason: `This account is used by ${used.count} entr${used.count === 1 ? "y" : "ies"}. Deleting it would break those records.`,
    };
  }

  db.prepare(`DELETE FROM accounts WHERE tenant_id = ? AND code = ?`).run(
    tenantId,
    code
  );
  return { deleted: true };
}

/* ------------------------------------------------------------------ */
/* Journal entries                                                     */
/* ------------------------------------------------------------------ */

const VOUCHER_PREFIX: Record<VoucherType, string> = {
  SALE: "SL",
  PURCHASE: "PU",
  SALES_RETURN: "SR",
  PURCHASE_RETURN: "PR",
  EXPENSE: "EX",
  RECEIPT: "RC",
  PAYMENT: "PY",
  CONTRA: "CN",
  JOURNAL: "JV",
  OPENING: "OP",
  CLOSING: "CL",
};

/**
 * Next voucher number for a type, e.g. "SL-0007".
 *
 * Derived from the highest existing number rather than a counter column so that
 * a deleted entry does not leave a permanent gap in the sequence. Called inside
 * the insert transaction; the unique index on (tenant_id, voucher_no) turns a
 * concurrent race into a loud failure rather than a duplicate.
 */
export function nextVoucherNo(tenantId: string, type: VoucherType): string {
  const prefix = VOUCHER_PREFIX[type];
  const row: any = getDatabase()
    .prepare(
      `SELECT voucher_no FROM journal_entries
        WHERE tenant_id = ? AND voucher_no LIKE ?
        ORDER BY LENGTH(voucher_no) DESC, voucher_no DESC
        LIMIT 1`
    )
    .get(tenantId, `${prefix}-%`);

  const previous = row ? Number(String(row.voucher_no).split("-")[1]) : 0;
  return `${prefix}-${String(previous + 1).padStart(4, "0")}`;
}

export interface CreateEntryInput {
  tenantId: string;
  date: string;
  voucherType: VoucherType;
  narration: string;
  lines: JournalLine[];
  reference?: string;
  gst?: GstDetail;
  createdBy?: string;
}

/**
 * Persists a journal entry and its lines atomically.
 *
 * The entry is re-validated here even though the voucher builders produce
 * balanced entries by construction: this is the last point before the data
 * becomes permanent, and an unbalanced entry reaching the ledger would silently
 * corrupt every report derived from it.
 */
export function createJournalEntry(input: CreateEntryInput): JournalEntry {
  const db = getDatabase();
  const accountIndex = new Map(
    listAccounts(input.tenantId).map((account) => [account.code, account])
  );

  const validation = validateEntry(input.lines, accountIndex, input.date);
  if (!validation.valid) {
    throw new Error(validation.issues.join(" "));
  }

  return transaction(() => {
    const id = newId("ent");
    const voucherNo = nextVoucherNo(input.tenantId, input.voucherType);
    const createdAt = nowIso();

    db.prepare(
      `INSERT INTO journal_entries
         (id, tenant_id, entry_date, voucher_no, voucher_type, narration,
          reference, gst_json, created_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      input.tenantId,
      input.date,
      voucherNo,
      input.voucherType,
      input.narration,
      input.reference ?? null,
      input.gst ? JSON.stringify(input.gst) : null,
      createdAt,
      input.createdBy ?? null
    );

    const insertLine = db.prepare(
      `INSERT INTO journal_lines
         (id, entry_id, tenant_id, line_no, account_code, debit, credit, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    input.lines.forEach((line, index) => {
      insertLine.run(
        newId("lin"),
        id,
        input.tenantId,
        index + 1,
        line.accountCode,
        line.debit,
        line.credit,
        line.note ?? null
      );
    });

    return {
      id,
      date: input.date,
      voucherNo,
      voucherType: input.voucherType,
      narration: input.narration,
      lines: input.lines,
      reference: input.reference,
      gst: input.gst,
      createdAt,
    };
  });
}

/**
 * Loads entries for a tenant, optionally within a date range.
 *
 * Lines are fetched in one query and grouped in memory rather than one query per
 * entry — a year of trading is a few thousand rows, and N+1 queries over that is
 * the difference between a report that renders instantly and one that does not.
 */
export function listJournalEntries(
  tenantId: string,
  range?: { from?: string; to?: string }
): JournalEntry[] {
  const db = getDatabase();

  /** Builds the same filter for either the entries table or its join alias. */
  const where = (alias: string) => {
    const conditions = [`${alias}.tenant_id = ?`];
    const params: unknown[] = [tenantId];
    if (range?.from) {
      conditions.push(`${alias}.entry_date >= ?`);
      params.push(range.from);
    }
    if (range?.to) {
      conditions.push(`${alias}.entry_date <= ?`);
      params.push(range.to);
    }
    return { sql: conditions.join(" AND "), params };
  };

  const entryFilter = where("e");

  const entryRows: any[] = db
    .prepare(
      `SELECT e.* FROM journal_entries e
        WHERE ${entryFilter.sql}
        ORDER BY e.entry_date, e.voucher_no`
    )
    .all(...entryFilter.params);

  if (entryRows.length === 0) return [];

  const lineRows: any[] = db
    .prepare(
      `SELECT l.* FROM journal_lines l
         JOIN journal_entries e ON e.id = l.entry_id
        WHERE ${entryFilter.sql}
        ORDER BY l.entry_id, l.line_no`
    )
    .all(...entryFilter.params);

  const linesByEntry = new Map<string, JournalLine[]>();
  for (const row of lineRows) {
    const existing = linesByEntry.get(row.entry_id) ?? [];
    existing.push({
      accountCode: row.account_code,
      debit: row.debit,
      credit: row.credit,
      note: row.note ?? undefined,
    });
    linesByEntry.set(row.entry_id, existing);
  }

  return entryRows.map((row) => ({
    id: row.id,
    date: row.entry_date,
    voucherNo: row.voucher_no,
    voucherType: row.voucher_type,
    narration: row.narration,
    reference: row.reference ?? undefined,
    gst: row.gst_json ? (JSON.parse(row.gst_json) as GstDetail) : undefined,
    lines: linesByEntry.get(row.id) ?? [],
    createdAt: row.created_at,
  }));
}

export function getJournalEntry(
  tenantId: string,
  entryId: string
): JournalEntry | null {
  const db = getDatabase();
  const row: any = db
    .prepare(`SELECT * FROM journal_entries WHERE tenant_id = ? AND id = ?`)
    .get(tenantId, entryId);
  if (!row) return null;

  const lines: any[] = db
    .prepare(
      `SELECT * FROM journal_lines
        WHERE tenant_id = ? AND entry_id = ? ORDER BY line_no`
    )
    .all(tenantId, entryId);

  return {
    id: row.id,
    date: row.entry_date,
    voucherNo: row.voucher_no,
    voucherType: row.voucher_type,
    narration: row.narration,
    reference: row.reference ?? undefined,
    gst: row.gst_json ? (JSON.parse(row.gst_json) as GstDetail) : undefined,
    lines: lines.map((line) => ({
      accountCode: line.account_code,
      debit: line.debit,
      credit: line.credit,
      note: line.note ?? undefined,
    })),
    createdAt: row.created_at,
  };
}

export function deleteJournalEntry(tenantId: string, entryId: string): boolean {
  // Lines cascade via the foreign key.
  return (
    getDatabase()
      .prepare(`DELETE FROM journal_entries WHERE tenant_id = ? AND id = ?`)
      .run(tenantId, entryId).changes > 0
  );
}

export function countJournalEntries(
  tenantId: string,
  range?: { from: string; to: string }
): number {
  const row: any = range
    ? getDatabase()
        .prepare(
          `SELECT COUNT(*) AS count FROM journal_entries
            WHERE tenant_id = ? AND entry_date BETWEEN ? AND ?`
        )
        .get(tenantId, range.from, range.to)
    : getDatabase()
        .prepare(`SELECT COUNT(*) AS count FROM journal_entries WHERE tenant_id = ?`)
        .get(tenantId);
  return row.count;
}

/* ------------------------------------------------------------------ */
/* Periods                                                             */
/* ------------------------------------------------------------------ */

export function getPeriod(
  tenantId: string,
  label: string
): (PeriodAdjustments & { startDate: string; endDate: string; isClosed: boolean }) | null {
  const row: any = getDatabase()
    .prepare(`SELECT * FROM periods WHERE tenant_id = ? AND label = ?`)
    .get(tenantId, label);
  if (!row) return null;
  return {
    openingStock: row.opening_stock,
    closingStock: row.closing_stock,
    startDate: row.start_date,
    endDate: row.end_date,
    isClosed: row.is_closed === 1,
  };
}

export function upsertPeriod(input: {
  tenantId: string;
  label: string;
  startDate: string;
  endDate: string;
  openingStock: Paise;
  closingStock: Paise;
}): void {
  getDatabase()
    .prepare(
      `INSERT INTO periods
         (tenant_id, label, start_date, end_date, opening_stock, closing_stock, is_closed)
       VALUES (?, ?, ?, ?, ?, ?, 0)
       ON CONFLICT(tenant_id, label) DO UPDATE SET
         start_date = excluded.start_date,
         end_date = excluded.end_date,
         opening_stock = excluded.opening_stock,
         closing_stock = excluded.closing_stock`
    )
    .run(
      input.tenantId,
      input.label,
      input.startDate,
      input.endDate,
      input.openingStock,
      input.closingStock
    );
}

/* ------------------------------------------------------------------ */
/* Audit log                                                           */
/* ------------------------------------------------------------------ */

export interface AuditEvent {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  detail: unknown;
  createdAt: string;
}

export function appendAudit(input: {
  tenantId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  detail?: unknown;
}): void {
  getDatabase()
    .prepare(
      `INSERT INTO audit_log
         (id, tenant_id, user_id, action, entity, entity_id, detail_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      newId("aud"),
      input.tenantId,
      input.userId ?? null,
      input.action,
      input.entity,
      input.entityId ?? null,
      input.detail === undefined ? null : JSON.stringify(input.detail),
      nowIso()
    );
}

export function listAudit(tenantId: string, limit = 100): AuditEvent[] {
  return getDatabase()
    .prepare(
      `SELECT * FROM audit_log WHERE tenant_id = ?
        ORDER BY created_at DESC LIMIT ?`
    )
    .all(tenantId, limit)
    .map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      action: row.action,
      entity: row.entity,
      entityId: row.entity_id,
      detail: row.detail_json ? JSON.parse(row.detail_json) : null,
      createdAt: row.created_at,
    }));
}
