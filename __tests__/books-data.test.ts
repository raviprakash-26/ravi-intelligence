// @vitest-environment node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// The database path has to be set before the client module is first imported,
// so every import below is dynamic and happens inside beforeAll.
const workingDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "books-test-"));
process.env.BOOKS_DATABASE_PATH = path.join(workingDirectory, "test.db");

type Repository = typeof import("@/lib/db/repository");
type Client = typeof import("@/lib/db/client");
type Password = typeof import("@/lib/auth/password");

let repository: Repository;
let client: Client;
let password: Password;

beforeAll(async () => {
  repository = await import("@/lib/db/repository");
  client = await import("@/lib/db/client");
  password = await import("@/lib/auth/password");
});

afterAll(() => {
  client.closeDatabase();
  fs.rmSync(workingDirectory, { recursive: true, force: true });
});

function makeStore(name: string) {
  const tenant = repository.createTenant({
    name,
    stateCode: "33",
    financialYear: "2025-26",
  });
  repository.seedChartOfAccounts(tenant.id);
  return tenant;
}

describe("password hashing", () => {
  it("verifies a correct password and rejects a wrong one", async () => {
    const { hash, salt } = await password.hashPassword("correct horse battery");
    expect(await password.verifyPassword("correct horse battery", hash, salt)).toBe(true);
    expect(await password.verifyPassword("wrong password", hash, salt)).toBe(false);
  });

  it("produces a different hash for the same password each time", async () => {
    const first = await password.hashPassword("same password 12");
    const second = await password.hashPassword("same password 12");
    // Distinct salts mean two users with the same password have unlike hashes.
    expect(first.hash).not.toBe(second.hash);
    expect(first.salt).not.toBe(second.salt);
  });

  it("never stores the password itself", async () => {
    const { hash, salt } = await password.hashPassword("plaintext secret 1");
    expect(hash).not.toContain("plaintext");
    expect(salt).not.toContain("plaintext");
  });

  it("rejects weak passwords at the policy layer", () => {
    expect(password.checkPasswordStrength("short1").acceptable).toBe(false);
    expect(password.checkPasswordStrength("password123").acceptable).toBe(false);
    expect(password.checkPasswordStrength("alllettersnodigits").acceptable).toBe(false);
    expect(password.checkPasswordStrength("shopkeeper2025").acceptable).toBe(true);
  });
});

describe("store setup", () => {
  it("seeds a full chart of accounts", () => {
    const tenant = makeStore("Seed Test Store");
    const accounts = repository.listAccounts(tenant.id);
    expect(accounts.length).toBeGreaterThan(40);
    expect(accounts.find((account) => account.code === "1010")?.name).toBe("Cash in Hand");
    expect(accounts.find((account) => account.code === "4010")?.isSystem).toBe(true);
    expect(accounts.find((account) => account.code === "4020")?.isContra).toBe(true);
  });

  it("starts a new store on a trial", () => {
    const tenant = makeStore("Trial Store");
    expect(tenant.plan).toBe("TRIAL");
    expect(tenant.subscriptionStatus).toBe("TRIALING");
    expect(tenant.trialEndsAt).toBeTruthy();
    expect(new Date(tenant.trialEndsAt!).getTime()).toBeGreaterThan(Date.now());
  });
});

describe("journal persistence", () => {
  it("stores an entry with its lines and reads them back", () => {
    const tenant = makeStore("Persistence Store");
    const entry = repository.createJournalEntry({
      tenantId: tenant.id,
      date: "2025-06-01",
      voucherType: "SALE",
      narration: "Counter sale",
      lines: [
        { accountCode: "1010", debit: 118000, credit: 0 },
        { accountCode: "4010", debit: 0, credit: 100000 },
        { accountCode: "2110", debit: 0, credit: 9000 },
        { accountCode: "2120", debit: 0, credit: 9000 },
      ],
    });

    expect(entry.voucherNo).toBe("SL-0001");

    const loaded = repository.getJournalEntry(tenant.id, entry.id)!;
    expect(loaded.lines).toHaveLength(4);
    expect(loaded.lines[0].accountCode).toBe("1010");
    expect(loaded.lines[0].debit).toBe(118000);
    expect(
      loaded.lines.reduce((sum, line) => sum + line.debit, 0)
    ).toBe(loaded.lines.reduce((sum, line) => sum + line.credit, 0));
  });

  it("refuses to store an unbalanced entry", () => {
    const tenant = makeStore("Validation Store");
    expect(() =>
      repository.createJournalEntry({
        tenantId: tenant.id,
        date: "2025-06-01",
        voucherType: "JOURNAL",
        narration: "Broken",
        lines: [
          { accountCode: "1010", debit: 10000, credit: 0 },
          { accountCode: "4010", debit: 0, credit: 9000 },
        ],
      })
    ).toThrow();

    // The failed write must leave nothing behind.
    expect(repository.countJournalEntries(tenant.id)).toBe(0);
  });

  it("rolls back the whole entry when a line cannot be written", () => {
    const tenant = makeStore("Atomicity Store");
    expect(() =>
      repository.createJournalEntry({
        tenantId: tenant.id,
        date: "2025-06-01",
        voucherType: "JOURNAL",
        narration: "Unknown account",
        lines: [
          { accountCode: "1010", debit: 10000, credit: 0 },
          { accountCode: "9999", debit: 0, credit: 10000 },
        ],
      })
    ).toThrow();
    expect(repository.countJournalEntries(tenant.id)).toBe(0);
  });

  it("numbers vouchers per type and increments them", () => {
    const tenant = makeStore("Numbering Store");
    const sale = () =>
      repository.createJournalEntry({
        tenantId: tenant.id,
        date: "2025-06-01",
        voucherType: "SALE",
        narration: "Sale",
        lines: [
          { accountCode: "1010", debit: 1000, credit: 0 },
          { accountCode: "4010", debit: 0, credit: 1000 },
        ],
      });

    expect(sale().voucherNo).toBe("SL-0001");
    expect(sale().voucherNo).toBe("SL-0002");

    const payment = repository.createJournalEntry({
      tenantId: tenant.id,
      date: "2025-06-02",
      voucherType: "PAYMENT",
      narration: "Payment",
      lines: [
        { accountCode: "2010", debit: 500, credit: 0 },
        { accountCode: "1010", debit: 0, credit: 500 },
      ],
    });
    // Each voucher type carries its own sequence.
    expect(payment.voucherNo).toBe("PY-0001");
  });

  it("filters entries by date range", () => {
    const tenant = makeStore("Range Store");
    for (const date of ["2025-04-10", "2025-08-10", "2026-02-10"]) {
      repository.createJournalEntry({
        tenantId: tenant.id,
        date,
        voucherType: "SALE",
        narration: "Sale",
        lines: [
          { accountCode: "1010", debit: 1000, credit: 0 },
          { accountCode: "4010", debit: 0, credit: 1000 },
        ],
      });
    }

    expect(repository.listJournalEntries(tenant.id)).toHaveLength(3);
    expect(
      repository.listJournalEntries(tenant.id, { from: "2025-07-01", to: "2025-12-31" })
    ).toHaveLength(1);
  });

  it("round-trips GST detail through storage", () => {
    const tenant = makeStore("GST Store");
    const entry = repository.createJournalEntry({
      tenantId: tenant.id,
      date: "2025-06-01",
      voucherType: "SALE",
      narration: "Sale with GST",
      lines: [
        { accountCode: "1010", debit: 118000, credit: 0 },
        { accountCode: "4010", debit: 0, credit: 100000 },
        { accountCode: "2110", debit: 0, credit: 9000 },
        { accountCode: "2120", debit: 0, credit: 9000 },
      ],
      gst: {
        direction: "OUTWARD",
        supplyType: "INTRA_STATE",
        rate: 18,
        taxableValue: 100000,
        cgst: 9000,
        sgst: 9000,
        igst: 0,
        cess: 0,
        placeOfSupply: "33",
        itcEligible: false,
        reverseCharge: false,
        hsnCode: "6109",
      },
    });

    const loaded = repository.getJournalEntry(tenant.id, entry.id)!;
    expect(loaded.gst?.rate).toBe(18);
    expect(loaded.gst?.supplyType).toBe("INTRA_STATE");
    expect(loaded.gst?.hsnCode).toBe("6109");
  });
});

describe("tenant isolation", () => {
  it("never returns one store's entries to another", () => {
    const first = makeStore("Anand Stores");
    const second = makeStore("Kumar Traders");

    repository.createJournalEntry({
      tenantId: first.id,
      date: "2025-06-01",
      voucherType: "SALE",
      narration: "Anand's sale",
      lines: [
        { accountCode: "1010", debit: 500000, credit: 0 },
        { accountCode: "4010", debit: 0, credit: 500000 },
      ],
    });

    expect(repository.listJournalEntries(first.id)).toHaveLength(1);
    expect(repository.listJournalEntries(second.id)).toHaveLength(0);
    expect(repository.countJournalEntries(second.id)).toBe(0);
  });

  it("will not fetch an entry belonging to another store even by id", () => {
    const first = makeStore("Owner Store");
    const second = makeStore("Attacker Store");

    const entry = repository.createJournalEntry({
      tenantId: first.id,
      date: "2025-06-01",
      voucherType: "SALE",
      narration: "Private",
      lines: [
        { accountCode: "1010", debit: 1000, credit: 0 },
        { accountCode: "4010", debit: 0, credit: 1000 },
      ],
    });

    // Knowing the id is not enough — the tenant must match too.
    expect(repository.getJournalEntry(first.id, entry.id)).not.toBeNull();
    expect(repository.getJournalEntry(second.id, entry.id)).toBeNull();
    expect(repository.deleteJournalEntry(second.id, entry.id)).toBe(false);
    expect(repository.getJournalEntry(first.id, entry.id)).not.toBeNull();
  });

  it("keeps each store's chart of accounts separate", () => {
    const first = makeStore("Chart A");
    const second = makeStore("Chart B");

    repository.createAccount(first.id, {
      code: "6300",
      name: "Festival Decorations",
      type: "EXPENSE",
      group: "INDIRECT_EXPENSE",
      isContra: false,
      isSystem: false,
    });

    expect(repository.getAccount(first.id, "6300")).not.toBeNull();
    expect(repository.getAccount(second.id, "6300")).toBeNull();
  });
});

describe("account protection", () => {
  it("refuses to delete a system account", () => {
    const tenant = makeStore("Protect Store");
    const result = repository.deleteAccount(tenant.id, "4010");
    expect(result.deleted).toBe(false);
    expect(result.reason).toContain("built-in");
  });

  it("refuses to delete an account that has entries against it", () => {
    const tenant = makeStore("In Use Store");
    repository.createAccount(tenant.id, {
      code: "6310",
      name: "Custom Expense",
      type: "EXPENSE",
      group: "INDIRECT_EXPENSE",
      isContra: false,
      isSystem: false,
    });
    repository.createJournalEntry({
      tenantId: tenant.id,
      date: "2025-06-01",
      voucherType: "EXPENSE",
      narration: "Custom spend",
      lines: [
        { accountCode: "6310", debit: 1000, credit: 0 },
        { accountCode: "1010", debit: 0, credit: 1000 },
      ],
    });

    const result = repository.deleteAccount(tenant.id, "6310");
    expect(result.deleted).toBe(false);
    expect(result.reason).toContain("1 entry");
  });

  it("deletes an unused custom account", () => {
    const tenant = makeStore("Unused Store");
    repository.createAccount(tenant.id, {
      code: "6320",
      name: "Never Used",
      type: "EXPENSE",
      group: "INDIRECT_EXPENSE",
      isContra: false,
      isSystem: false,
    });
    expect(repository.deleteAccount(tenant.id, "6320").deleted).toBe(true);
    expect(repository.getAccount(tenant.id, "6320")).toBeNull();
  });
});

describe("sessions", () => {
  it("returns a live session and forgets an expired one", async () => {
    const tenant = makeStore("Session Store");
    const { hash, salt } = await password.hashPassword("shopkeeper2025");
    const user = repository.createUser({
      tenantId: tenant.id,
      email: `owner-${tenant.id}@example.com`,
      name: "Owner",
      passwordHash: hash,
      passwordSalt: salt,
    });

    const live = repository.createSession({
      userId: user.id,
      tenantId: tenant.id,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    expect(repository.getLiveSession(live.id)?.userId).toBe(user.id);

    const stale = repository.createSession({
      userId: user.id,
      tenantId: tenant.id,
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    });
    // An expired session is treated as absent and cleaned up on read.
    expect(repository.getLiveSession(stale.id)).toBeNull();
    expect(repository.getLiveSession(stale.id)).toBeNull();
  });

  it("signs a user out of every device at once", async () => {
    const tenant = makeStore("Multi Device Store");
    const { hash, salt } = await password.hashPassword("shopkeeper2025");
    const user = repository.createUser({
      tenantId: tenant.id,
      email: `multi-${tenant.id}@example.com`,
      name: "Owner",
      passwordHash: hash,
      passwordSalt: salt,
    });

    const phone = repository.createSession({
      userId: user.id,
      tenantId: tenant.id,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    const counter = repository.createSession({
      userId: user.id,
      tenantId: tenant.id,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });

    repository.deleteSessionsForUser(user.id);
    expect(repository.getLiveSession(phone.id)).toBeNull();
    expect(repository.getLiveSession(counter.id)).toBeNull();
  });

  it("enforces one account per email address", async () => {
    const tenant = makeStore("Unique Email Store");
    const { hash, salt } = await password.hashPassword("shopkeeper2025");
    const email = `unique-${tenant.id}@example.com`;

    repository.createUser({
      tenantId: tenant.id,
      email,
      name: "First",
      passwordHash: hash,
      passwordSalt: salt,
    });

    expect(repository.emailExists(email)).toBe(true);
    expect(repository.emailExists(email.toUpperCase())).toBe(true);
    expect(() =>
      repository.createUser({
        tenantId: tenant.id,
        email,
        name: "Second",
        passwordHash: hash,
        passwordSalt: salt,
      })
    ).toThrow();
  });
});

describe("periods and audit", () => {
  it("saves and updates the counted stock figures", () => {
    const tenant = makeStore("Stock Store");
    repository.upsertPeriod({
      tenantId: tenant.id,
      label: "2025-26",
      startDate: "2025-04-01",
      endDate: "2026-03-31",
      openingStock: 100000,
      closingStock: 0,
    });
    expect(repository.getPeriod(tenant.id, "2025-26")?.openingStock).toBe(100000);

    repository.upsertPeriod({
      tenantId: tenant.id,
      label: "2025-26",
      startDate: "2025-04-01",
      endDate: "2026-03-31",
      openingStock: 100000,
      closingStock: 80000,
    });
    const period = repository.getPeriod(tenant.id, "2025-26")!;
    expect(period.closingStock).toBe(80000);
    expect(period.openingStock).toBe(100000);
  });

  it("records an audit trail newest first", () => {
    const tenant = makeStore("Audit Store");
    repository.appendAudit({
      tenantId: tenant.id,
      action: "ENTRY_CREATED",
      entity: "journal_entry",
      entityId: "ent_1",
      detail: { voucherNo: "SL-0001" },
    });
    repository.appendAudit({
      tenantId: tenant.id,
      action: "ENTRY_DELETED",
      entity: "journal_entry",
      entityId: "ent_1",
    });

    const events = repository.listAudit(tenant.id);
    expect(events).toHaveLength(2);
    expect(events[0].action).toBe("ENTRY_DELETED");
    expect(events[1].detail).toEqual({ voucherNo: "SL-0001" });
  });
});
