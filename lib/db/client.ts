import "server-only";

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

/**
 * SQLite connection for the books.
 *
 * The connection is a module-level singleton because better-sqlite3 is
 * synchronous and cheap to hold open, and because Next.js will otherwise open a
 * new handle on every hot reload in development until the process runs out.
 */

let instance: Database.Database | null = null;

function databaseFile(): string {
  const configured = process.env.BOOKS_DATABASE_PATH;
  if (configured) return configured;
  return path.join(process.cwd(), "data", "books.db");
}

function applySchema(db: Database.Database): void {
  const schemaPath = path.join(process.cwd(), "lib", "db", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  db.exec(schema);
}

export function getDatabase(): Database.Database {
  if (instance) return instance;

  const file = databaseFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const db = new Database(file);

  // Write-ahead logging lets reads proceed while a write is in flight, which
  // matters as soon as two people are using the same shop's books.
  db.pragma("journal_mode = WAL");
  // Referential integrity is off by default in SQLite. The schema depends on it.
  db.pragma("foreign_keys = ON");
  // Wait rather than fail immediately when another write holds the lock.
  db.pragma("busy_timeout = 5000");

  applySchema(db);

  instance = db;
  return db;
}

/**
 * Runs a function inside a database transaction.
 *
 * Posting an entry writes one row to `journal_entries` and several to
 * `journal_lines`. A crash between those writes would leave a half-entry whose
 * debits do not equal its credits — exactly the corruption the whole engine is
 * designed to prevent — so the writes must be atomic.
 */
export function transaction<T>(work: () => T): T {
  const db = getDatabase();
  return db.transaction(work)();
}

/** Closes the connection. Used by tests; the app holds it open for its lifetime. */
export function closeDatabase(): void {
  instance?.close();
  instance = null;
}

/** Monotonic, sortable identifier: a timestamp prefix plus random suffix. */
export function newId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${timestamp}${random}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
