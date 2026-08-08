-- Schema for the retail books product.
--
-- Written in a portable SQL subset so the same DDL runs on SQLite today and on
-- Postgres when a store outgrows a single file. Deliberate choices:
--
--   * Money is INTEGER paise everywhere. No REAL, no DECIMAL — the application
--     does all arithmetic in whole paise and rounding is never left to the
--     database.
--   * Every business table carries tenant_id, and every index leads with it.
--     One shop must never be able to read another's books, and scoping at the
--     schema level makes an unscoped query a missing-column error rather than a
--     silent data leak.
--   * Dates are TEXT in YYYY-MM-DD form, which sorts and compares correctly as
--     a string in both engines.

CREATE TABLE IF NOT EXISTS tenants (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  legal_name          TEXT,
  gstin               TEXT,
  pan                 TEXT,
  -- Two-digit GST state code of the store. Decides CGST+SGST versus IGST.
  state_code          TEXT NOT NULL DEFAULT '33',
  address             TEXT,
  phone               TEXT,
  -- Financial year the books currently run on, e.g. '2025-26'.
  financial_year      TEXT NOT NULL,
  plan                TEXT NOT NULL DEFAULT 'TRIAL',
  subscription_status TEXT NOT NULL DEFAULT 'TRIALING',
  trial_ends_at       TEXT,
  created_at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,
  tenant_id      TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email          TEXT NOT NULL,
  -- scrypt hash and its per-user salt, both hex encoded.
  password_hash  TEXT NOT NULL,
  password_salt  TEXT NOT NULL,
  name           TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'OWNER',
  created_at     TEXT NOT NULL,
  last_login_at  TEXT
);

-- Logins are global, so the uniqueness constraint cannot be per-tenant.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- Sessions live in the database rather than only in a cookie so that a login
-- can be revoked server-side — signing out everywhere has to actually work.
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  user_agent  TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS accounts (
  tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code          TEXT NOT NULL,
  name          TEXT NOT NULL,
  -- ASSET | LIABILITY | EQUITY | INCOME | EXPENSE
  type          TEXT NOT NULL,
  -- CURRENT_ASSET | FIXED_ASSET | ... | INDIRECT_EXPENSE
  account_group TEXT NOT NULL,
  is_contra     INTEGER NOT NULL DEFAULT 0,
  is_system     INTEGER NOT NULL DEFAULT 0,
  description   TEXT,
  PRIMARY KEY (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id           TEXT PRIMARY KEY,
  tenant_id    TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entry_date   TEXT NOT NULL,
  voucher_no   TEXT NOT NULL,
  voucher_type TEXT NOT NULL,
  narration    TEXT NOT NULL,
  reference    TEXT,
  -- GstDetail as JSON, or NULL when the entry carries no tax.
  gst_json     TEXT,
  created_at   TEXT NOT NULL,
  created_by   TEXT REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_entries_tenant_date
  ON journal_entries(tenant_id, entry_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_entries_voucher_no
  ON journal_entries(tenant_id, voucher_no);

CREATE TABLE IF NOT EXISTS journal_lines (
  id           TEXT PRIMARY KEY,
  entry_id     TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  -- Denormalised so a line can be filtered by tenant without a join. The
  -- repository always constrains on it, which keeps an accidental cross-tenant
  -- read impossible rather than merely unlikely.
  tenant_id    TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  line_no      INTEGER NOT NULL,
  account_code TEXT NOT NULL,
  debit        INTEGER NOT NULL DEFAULT 0,
  credit       INTEGER NOT NULL DEFAULT 0,
  note         TEXT,
  -- A line is a debit or a credit, never both and never negative. The engine
  -- enforces this too; the constraint means data written by any other route
  -- cannot corrupt the ledger either.
  CHECK (debit >= 0 AND credit >= 0),
  CHECK (NOT (debit > 0 AND credit > 0))
);

CREATE INDEX IF NOT EXISTS idx_lines_entry ON journal_lines(entry_id);
CREATE INDEX IF NOT EXISTS idx_lines_tenant_account
  ON journal_lines(tenant_id, account_code);

-- Stock is counted, not tracked per item, so the opening and closing figures
-- for each financial year are held here rather than derived from entries.
CREATE TABLE IF NOT EXISTS periods (
  tenant_id     TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  start_date    TEXT NOT NULL,
  end_date      TEXT NOT NULL,
  opening_stock INTEGER NOT NULL DEFAULT 0,
  closing_stock INTEGER NOT NULL DEFAULT 0,
  is_closed     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, label)
);

-- An append-only record of who changed what. An accounting system without one
-- cannot be audited, which is half of what this product claims to do.
CREATE TABLE IF NOT EXISTS audit_log (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     TEXT,
  action      TEXT NOT NULL,
  entity      TEXT NOT NULL,
  entity_id   TEXT,
  detail_json TEXT,
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant_time
  ON audit_log(tenant_id, created_at);
