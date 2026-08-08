// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  DEFAULT_CHART_OF_ACCOUNTS,
  SYSTEM_ACCOUNTS,
  buildAccountIndex,
} from "@/lib/accounting/chart-of-accounts";
import {
  allocatePaise,
  formatPaise,
  groupIndian,
  rupeesToPaise,
} from "@/lib/accounting/money";
import {
  applyItcSetOff,
  buildGstr1,
  buildGstr3b,
  computeGstinCheckDigit,
  computeTaxOnInclusiveAmount,
  computeTaxOnTaxableValue,
  validateGstin,
} from "@/lib/accounting/gst";
import {
  buildValidatedEntry,
  validateEntry,
  type Voucher,
} from "@/lib/accounting/journal";
import {
  buildLedgerAccount,
  buildTrialBalance,
  computeBalances,
} from "@/lib/accounting/ledger";
import { buildFinancialStatements } from "@/lib/accounting/statements";
import { computeRatios, costOfGoodsSold } from "@/lib/accounting/ratios";
import {
  buildAdvanceTaxSchedule,
  compareRegimes,
  computeIncomeTax,
  computePresumptiveIncome,
} from "@/lib/accounting/tax";
import { fitTrend, forecastRevenue, monthlyNetSales } from "@/lib/accounting/forecast";
import type { JournalEntry } from "@/lib/accounting/types";

const accounts = DEFAULT_CHART_OF_ACCOUNTS;
const accountIndex = buildAccountIndex(accounts);
const TAMIL_NADU = "33";
const KARNATAKA = "29";

/** Rupees to paise, for readable test fixtures. */
const R = (rupees: number) => rupeesToPaise(rupees);

let sequence = 0;
function post(voucher: Voucher, supplierStateCode = TAMIL_NADU): JournalEntry {
  sequence += 1;
  const built = buildValidatedEntry(voucher, {
    supplierStateCode,
    accountIndex,
  });
  return {
    id: `e${sequence}`,
    voucherNo: `V-${String(sequence).padStart(4, "0")}`,
    date: built.date,
    voucherType: built.voucherType,
    narration: built.narration,
    lines: built.lines,
    reference: built.reference,
    gst: built.gst,
    createdAt: `${built.date}T10:00:00.000Z`,
  };
}

/* ================================================================== */
/* Money                                                               */
/* ================================================================== */

describe("money", () => {
  it("parses rupee strings into exact paise", () => {
    expect(rupeesToPaise("1234.50")).toBe(123450);
    expect(rupeesToPaise("₹1,234.50")).toBe(123450);
    expect(rupeesToPaise("0.01")).toBe(1);
    expect(rupeesToPaise("100")).toBe(10000);
    expect(rupeesToPaise("-45.99")).toBe(-4599);
  });

  it("rejects sub-paise precision instead of silently rounding", () => {
    expect(() => rupeesToPaise("100.567")).toThrow();
    expect(() => rupeesToPaise("abc")).toThrow();
    expect(() => rupeesToPaise("")).toThrow();
  });

  it("avoids the floating point error that breaks naive money maths", () => {
    // 0.1 + 0.2 !== 0.3 in floating point; in paise it is exact.
    expect(rupeesToPaise("0.1") + rupeesToPaise("0.2")).toBe(rupeesToPaise("0.3"));
  });

  it("groups digits in the Indian lakh/crore convention", () => {
    expect(groupIndian(1234567)).toBe("12,34,567");
    expect(groupIndian(100000)).toBe("1,00,000");
    expect(groupIndian(999)).toBe("999");
    expect(formatPaise(123456789)).toBe("₹12,34,567.89");
    expect(formatPaise(-5000)).toBe("-₹50.00");
  });

  it("allocates without losing or inventing paise", () => {
    // An odd number of paise split two ways must still sum to the original.
    expect(allocatePaise(50005, [1, 1])).toEqual([25003, 25002]);
    expect(allocatePaise(50005, [1, 1]).reduce((a, b) => a + b, 0)).toBe(50005);
    expect(allocatePaise(100, [1, 1, 1]).reduce((a, b) => a + b, 0)).toBe(100);
    expect(allocatePaise(-101, [1, 1]).reduce((a, b) => a + b, 0)).toBe(-101);
  });
});

/* ================================================================== */
/* GST                                                                 */
/* ================================================================== */

describe("GST computation", () => {
  it("splits intra-state tax into equal CGST and SGST", () => {
    const split = computeTaxOnTaxableValue(R(1000), 18, "INTRA_STATE");
    expect(split.cgst).toBe(R(90));
    expect(split.sgst).toBe(R(90));
    expect(split.igst).toBe(0);
    expect(split.total).toBe(R(1180));
  });

  it("charges IGST at the full rate on inter-state supply", () => {
    const split = computeTaxOnTaxableValue(R(1000), 18, "INTER_STATE");
    expect(split.igst).toBe(R(180));
    expect(split.cgst).toBe(0);
    expect(split.sgst).toBe(0);
  });

  it("keeps CGST plus SGST exactly equal to total tax on odd amounts", () => {
    // 5% of ₹100.01 is 500.05 paise; halving naively would drop a paise.
    const split = computeTaxOnTaxableValue(10001, 5, "INTRA_STATE");
    expect(split.cgst + split.sgst).toBe(500);
    expect(split.total).toBe(10001 + 500);
  });

  it("back-calculates taxable value from a tax-inclusive counter price", () => {
    const split = computeTaxOnInclusiveAmount(R(1180), 18, "INTRA_STATE");
    expect(split.taxableValue).toBe(R(1000));
    expect(split.cgst).toBe(R(90));
    expect(split.sgst).toBe(R(90));
    // The customer paid exactly this; the parts must reconstruct it.
    expect(split.taxableValue + split.cgst + split.sgst).toBe(R(1180));
  });

  it("reconstructs the inclusive amount even when the split is not exact", () => {
    const split = computeTaxOnInclusiveAmount(9999, 18, "INTRA_STATE");
    expect(split.taxableValue + split.cgst + split.sgst).toBe(9999);
  });
});

describe("GSTIN validation", () => {
  it("accepts a GSTIN with a correct check digit", () => {
    // Build a structurally valid GSTIN and append its computed check digit.
    const first14 = "33AABCU9603R1Z";
    const gstin = first14 + computeGstinCheckDigit(first14);
    const result = validateGstin(gstin);
    expect(result.valid).toBe(true);
    expect(result.stateCode).toBe("33");
    expect(result.stateName).toBe("Tamil Nadu");
    expect(result.pan).toBe("AABCU9603R");
  });

  it("rejects a GSTIN whose check digit does not match", () => {
    const first14 = "33AABCU9603R1Z";
    const correct = computeGstinCheckDigit(first14);
    const wrong = correct === "0" ? "1" : "0";
    expect(validateGstin(first14 + wrong).valid).toBe(false);
  });

  it("rejects wrong length, bad format and unknown state codes", () => {
    expect(validateGstin("33AABCU9603R1Z").valid).toBe(false);
    expect(validateGstin("XXAABCU9603R1Z5").valid).toBe(false);
    expect(validateGstin("99AABCU9603R1Z5").reason).toBeDefined();
  });
});

describe("input tax credit set-off", () => {
  it("uses IGST credit first, then CGST and SGST against their own heads", () => {
    const result = applyItcSetOff(
      { igst: R(1000), cgst: R(500), sgst: R(500) },
      { igst: R(1200), cgst: R(300), sgst: R(300) }
    );

    expect(result.utilisation.igstCredit.againstIgst).toBe(R(1000));
    // The ₹200 of IGST credit left over spills onto CGST first.
    expect(result.utilisation.igstCredit.againstCgst).toBe(R(200));
    expect(result.utilisation.igstCredit.againstSgst).toBe(0);
    expect(result.cashPayable.igst).toBe(0);
    expect(result.cashPayable.cgst).toBe(0);
    expect(result.cashPayable.sgst).toBe(R(200));
    expect(result.totalCashPayable).toBe(R(200));
  });

  it("never lets CGST credit discharge SGST liability", () => {
    const result = applyItcSetOff(
      { igst: 0, cgst: 0, sgst: R(1000) },
      { igst: 0, cgst: R(5000), sgst: 0 }
    );
    // Despite ample CGST credit, the SGST must still be paid in cash.
    expect(result.totalCashPayable).toBe(R(1000));
    expect(result.cashPayable.sgst).toBe(R(1000));
    expect(result.creditCarriedForward.cgst).toBe(R(5000));
  });

  it("carries unused credit forward", () => {
    const result = applyItcSetOff(
      { igst: 0, cgst: R(100), sgst: R(100) },
      { igst: 0, cgst: R(400), sgst: R(400) }
    );
    expect(result.totalCashPayable).toBe(0);
    expect(result.creditCarriedForward.cgst).toBe(R(300));
    expect(result.creditCarriedForward.sgst).toBe(R(300));
  });

  it("conserves value: liability equals credit used plus cash paid", () => {
    const liability = { igst: R(700), cgst: R(400), sgst: R(400) };
    const credit = { igst: R(500), cgst: R(600), sgst: R(100) };
    const result = applyItcSetOff(liability, credit);

    const used =
      Object.values(result.utilisation.igstCredit).reduce((a, b) => a + b, 0) +
      Object.values(result.utilisation.cgstCredit).reduce((a, b) => a + b, 0) +
      Object.values(result.utilisation.sgstCredit).reduce((a, b) => a + b, 0);

    const totalLiability = liability.igst + liability.cgst + liability.sgst;
    expect(used + result.totalCashPayable).toBe(totalLiability);
  });
});

/* ================================================================== */
/* Journal                                                             */
/* ================================================================== */

describe("journal validation", () => {
  it("rejects an entry whose debits and credits differ", () => {
    const result = validateEntry(
      [
        { accountCode: "1010", debit: R(100), credit: 0 },
        { accountCode: "4010", debit: 0, credit: R(90) },
      ],
      accountIndex
    );
    expect(result.valid).toBe(false);
    expect(result.issues.join(" ")).toContain("differ by ₹10.00");
  });

  it("rejects a line that is both a debit and a credit", () => {
    const result = validateEntry(
      [
        { accountCode: "1010", debit: R(100), credit: R(100) },
        { accountCode: "4010", debit: 0, credit: R(100) },
      ],
      accountIndex
    );
    expect(result.valid).toBe(false);
    expect(result.issues.join(" ")).toContain("not both");
  });

  it("rejects unknown accounts and single-line entries", () => {
    expect(
      validateEntry([{ accountCode: "9999", debit: R(1), credit: 0 }], accountIndex)
        .valid
    ).toBe(false);
  });
});

describe("voucher to double entry", () => {
  it("records an intra-state cash sale with output CGST and SGST", () => {
    const entry = post({
      kind: "SALE",
      date: "2025-04-10",
      amount: R(1000),
      paymentMode: "CASH",
      gst: { rate: 18, placeOfSupply: TAMIL_NADU },
    });

    const byAccount = Object.fromEntries(
      entry.lines.map((line) => [line.accountCode, line.debit - line.credit])
    );
    expect(byAccount[SYSTEM_ACCOUNTS.cash]).toBe(R(1180));
    expect(byAccount[SYSTEM_ACCOUNTS.sales]).toBe(-R(1000));
    expect(byAccount[SYSTEM_ACCOUNTS.outputCgst]).toBe(-R(90));
    expect(byAccount[SYSTEM_ACCOUNTS.outputSgst]).toBe(-R(90));
    expect(entry.gst?.supplyType).toBe("INTRA_STATE");
  });

  it("switches to IGST when the place of supply is another state", () => {
    const entry = post({
      kind: "SALE",
      date: "2025-04-11",
      amount: R(1000),
      paymentMode: "CASH",
      gst: { rate: 18, placeOfSupply: KARNATAKA },
    });
    const codes = entry.lines.map((line) => line.accountCode);
    expect(codes).toContain(SYSTEM_ACCOUNTS.outputIgst);
    expect(codes).not.toContain(SYSTEM_ACCOUNTS.outputCgst);
    expect(entry.gst?.supplyType).toBe("INTER_STATE");
  });

  it("capitalises blocked input credit into the cost of purchases", () => {
    const eligible = post({
      kind: "PURCHASE",
      date: "2025-04-12",
      amount: R(1000),
      paymentMode: "CREDIT",
      gst: { rate: 18, placeOfSupply: TAMIL_NADU, itcEligible: true },
    });
    const blocked = post({
      kind: "PURCHASE",
      date: "2025-04-12",
      amount: R(1000),
      paymentMode: "CREDIT",
      gst: { rate: 18, placeOfSupply: TAMIL_NADU, itcEligible: false },
    });

    const purchasesOf = (entry: JournalEntry) =>
      entry.lines.find((line) => line.accountCode === SYSTEM_ACCOUNTS.purchases)!
        .debit;

    expect(purchasesOf(eligible)).toBe(R(1000));
    // Non-recoverable tax is not an asset, so it becomes part of the cost.
    expect(purchasesOf(blocked)).toBe(R(1180));
    expect(
      blocked.lines.some((line) => line.accountCode === SYSTEM_ACCOUNTS.inputCgst)
    ).toBe(false);
  });

  it("builds every voucher type as a balanced entry", () => {
    const vouchers: Voucher[] = [
      { kind: "SALE", date: "2025-05-01", amount: R(500), paymentMode: "CREDIT", gst: { rate: 12, placeOfSupply: TAMIL_NADU } },
      { kind: "PURCHASE", date: "2025-05-02", amount: R(400), paymentMode: "CASH", gst: { rate: 5, placeOfSupply: KARNATAKA } },
      { kind: "SALES_RETURN", date: "2025-05-03", amount: R(100), paymentMode: "CASH", gst: { rate: 12, placeOfSupply: TAMIL_NADU } },
      { kind: "PURCHASE_RETURN", date: "2025-05-04", amount: R(50), paymentMode: "CREDIT", gst: { rate: 5, placeOfSupply: KARNATAKA } },
      { kind: "EXPENSE", date: "2025-05-05", amount: R(200), expenseAccount: "6020", paymentMode: "BANK" },
      { kind: "RECEIPT", date: "2025-05-06", amount: R(300), fromAccount: "1100", into: "BANK" },
      { kind: "PAYMENT", date: "2025-05-07", amount: R(250), toAccount: "2010", from: "CASH" },
      { kind: "CONTRA", date: "2025-05-08", amount: R(1000), direction: "CASH_TO_BANK" },
      { kind: "CAPITAL", date: "2025-05-09", amount: R(5000), action: "INTRODUCE", through: "BANK" },
      { kind: "DEPRECIATION", date: "2025-05-10", amount: R(800), assetAccount: "1400" },
    ];

    for (const voucher of vouchers) {
      const entry = post(voucher);
      const debits = entry.lines.reduce((sum, line) => sum + line.debit, 0);
      const credits = entry.lines.reduce((sum, line) => sum + line.credit, 0);
      expect(debits, `${voucher.kind} should balance`).toBe(credits);
      expect(debits).toBeGreaterThan(0);
    }
  });
});

/* ================================================================== */
/* A full year of a small shop                                         */
/* ================================================================== */

/**
 * A complete, hand-checkable scenario. Every expected figure below was worked
 * out on paper first, so these assertions test the engine rather than merely
 * restating whatever it happens to produce.
 */
function buildScenario(): JournalEntry[] {
  sequence = 0;
  return [
    // Opening: ₹3,00,000 cash and ₹1,00,000 of stock, funded by capital.
    post({
      kind: "JOURNAL",
      date: "2025-04-01",
      amount: 0,
      narration: "Opening balances",
      lines: [
        { accountCode: SYSTEM_ACCOUNTS.cash, debit: R(300000), credit: 0 },
        { accountCode: SYSTEM_ACCOUNTS.closingStock, debit: R(100000), credit: 0 },
        { accountCode: SYSTEM_ACCOUNTS.capital, debit: 0, credit: R(400000) },
      ],
    }),
    // Goods bought on credit, ₹2,00,000 + 18% intra-state GST.
    post({
      kind: "PURCHASE",
      date: "2025-06-10",
      amount: R(200000),
      paymentMode: "CREDIT",
      gst: { rate: 18, placeOfSupply: TAMIL_NADU },
    }),
    // Goods sold for cash, ₹3,00,000 + 18% intra-state GST.
    post({
      kind: "SALE",
      date: "2025-09-15",
      amount: R(300000),
      paymentMode: "CASH",
      gst: { rate: 18, placeOfSupply: TAMIL_NADU },
    }),
    post({ kind: "EXPENSE", date: "2025-10-01", amount: R(20000), expenseAccount: SYSTEM_ACCOUNTS.rent, paymentMode: "CASH" }),
    post({ kind: "EXPENSE", date: "2025-10-05", amount: R(30000), expenseAccount: SYSTEM_ACCOUNTS.salaries, paymentMode: "CASH" }),
    post({ kind: "EXPENSE", date: "2025-11-01", amount: R(5000), expenseAccount: SYSTEM_ACCOUNTS.miscellaneous, paymentMode: "CASH" }),
    post({ kind: "PAYMENT", date: "2026-01-20", amount: R(100000), toAccount: SYSTEM_ACCOUNTS.creditors, from: "CASH" }),
  ];
}

const YEAR = { from: "2025-04-01", to: "2026-03-31" };
const ADJUSTMENTS = { openingStock: R(100000), closingStock: R(80000) };

describe("ledger and trial balance", () => {
  const entries = buildScenario();

  it("ties the trial balance", () => {
    const trialBalance = buildTrialBalance(accounts, entries, YEAR.to);
    expect(trialBalance.isBalanced).toBe(true);
    expect(trialBalance.totalDebit).toBe(trialBalance.totalCredit);
  });

  it("computes the cash account balance and running total", () => {
    const cash = buildLedgerAccount(
      accounts.find((account) => account.code === SYSTEM_ACCOUNTS.cash)!,
      entries,
      YEAR
    );
    // 300000 + 354000 − 20000 − 30000 − 5000 − 100000
    expect(cash.closingBalance).toBe(R(499000));
    expect(
      cash.movements[cash.movements.length - 1].runningBalance
    ).toBe(R(499000));
  });

  it("carries an opening balance when the window starts mid-year", () => {
    const cash = buildLedgerAccount(
      accounts.find((account) => account.code === SYSTEM_ACCOUNTS.cash)!,
      entries,
      { from: "2025-10-01", to: "2026-03-31" }
    );
    // Everything up to 30 Sep: 300000 + 354000
    expect(cash.openingBalance).toBe(R(654000));
    expect(cash.closingBalance).toBe(R(499000));
  });

  it("nets supplier dues after a part payment", () => {
    const balances = computeBalances(accounts, entries, YEAR.to);
    expect(balances.get(SYSTEM_ACCOUNTS.creditors)).toBe(R(136000));
  });
});

describe("financial statements", () => {
  const entries = buildScenario();
  const statements = buildFinancialStatements(accounts, entries, YEAR, ADJUSTMENTS);

  it("computes gross profit in the Trading Account", () => {
    const { trading } = statements;
    expect(trading.netSales).toBe(R(300000));
    expect(trading.netPurchases).toBe(R(200000));
    // (300000 + 80000) − (100000 + 200000)
    expect(trading.grossProfit).toBe(R(80000));
    expect(trading.totalDebitSide).toBe(trading.totalCreditSide);
  });

  it("computes net profit in the Profit & Loss Account", () => {
    const { profitAndLoss } = statements;
    expect(profitAndLoss.totalIndirectExpenses).toBe(R(55000));
    // 80000 − (20000 + 30000 + 5000)
    expect(profitAndLoss.netProfit).toBe(R(25000));
    expect(profitAndLoss.totalDebitSide).toBe(profitAndLoss.totalCreditSide);
  });

  it("produces a Balance Sheet that balances", () => {
    const { balanceSheet } = statements;
    // Cash 499000 + Input CGST 18000 + Input SGST 18000 + Closing stock 80000
    expect(balanceSheet.totalAssets).toBe(R(615000));
    // Creditors 136000 + Output CGST 27000 + Output SGST 27000
    expect(balanceSheet.totalCurrentLiabilities).toBe(R(190000));
    expect(balanceSheet.closingCapital).toBe(R(425000));
    expect(balanceSheet.totalLiabilitiesAndCapital).toBe(R(615000));
    expect(balanceSheet.isBalanced).toBe(true);
    expect(balanceSheet.difference).toBe(0);
  });

  it("uses counted closing stock rather than the stock account balance", () => {
    const stockLine = statements.balanceSheet.currentAssets.find(
      (line) => line.accountCode === SYSTEM_ACCOUNTS.closingStock
    );
    // The account still carries the ₹1,00,000 opening figure; the sheet shows the count.
    expect(stockLine?.amount).toBe(R(80000));
  });

  it("reconciles Receipts & Payments to the closing cash and bank balance", () => {
    const { receiptsAndPayments: rp } = statements;
    expect(rp.openingBalance).toBe(0);
    expect(rp.closingBalance).toBe(R(499000));
    expect(
      rp.openingBalance + rp.totalReceipts - rp.totalPayments
    ).toBe(rp.closingBalance);
  });

  it("excludes cash-to-bank transfers from Receipts & Payments", () => {
    const withTransfer = [
      ...entries,
      post({ kind: "CONTRA", date: "2025-12-01", amount: R(50000), direction: "CASH_TO_BANK" }),
    ];
    const before = statements.receiptsAndPayments;
    const after = buildFinancialStatements(
      accounts,
      withTransfer,
      YEAR,
      ADJUSTMENTS
    ).receiptsAndPayments;

    // Moving money between own accounts is neither a receipt nor a payment.
    expect(after.totalReceipts).toBe(before.totalReceipts);
    expect(after.totalPayments).toBe(before.totalPayments);
    expect(after.closingBalance).toBe(before.closingBalance);
    expect(after.closingCash).toBe(R(449000));
    expect(after.closingBank).toBe(R(50000));
  });

  it("agrees between Income & Expenditure surplus and net profit", () => {
    // The two statements are different views of the same period, so they must agree.
    expect(statements.incomeAndExpenditure.surplus).toBe(
      statements.profitAndLoss.netProfit
    );
  });
});

describe("ratios", () => {
  const entries = buildScenario();
  const statements = buildFinancialStatements(accounts, entries, YEAR, ADJUSTMENTS);
  const ratios = computeRatios({
    trading: statements.trading,
    profitAndLoss: statements.profitAndLoss,
    balanceSheet: statements.balanceSheet,
    daysInPeriod: 365,
  });

  const find = (key: string) => ratios.find((ratio) => ratio.key === key)!;

  it("derives cost of goods sold from the stock movement", () => {
    // 100000 + 200000 − 80000
    expect(costOfGoodsSold(statements.trading)).toBe(R(220000));
  });

  it("computes gross and net profit ratios", () => {
    // 80000 / 300000
    expect(find("gross-profit-ratio").value).toBeCloseTo(26.667, 2);
    // 25000 / 300000
    expect(find("net-profit-ratio").value).toBeCloseTo(8.333, 2);
  });

  it("computes the current ratio", () => {
    // 615000 / 190000
    expect(find("current-ratio").value).toBeCloseTo(3.2368, 3);
  });

  it("returns null rather than zero when a ratio cannot be computed", () => {
    const noSales = computeRatios({
      trading: { ...statements.trading, netSales: 0 },
      profitAndLoss: statements.profitAndLoss,
      balanceSheet: statements.balanceSheet,
      daysInPeriod: 365,
    });
    expect(noSales.find((ratio) => ratio.key === "gross-profit-ratio")!.value).toBeNull();
  });
});

/* ================================================================== */
/* GST returns                                                         */
/* ================================================================== */

describe("GST returns", () => {
  const entries = buildScenario();

  it("summarises GSTR-3B and computes cash payable after set-off", () => {
    const gstr3b = buildGstr3b(entries, YEAR);
    expect(gstr3b.outwardTotal.cgst).toBe(R(27000));
    expect(gstr3b.outwardTotal.sgst).toBe(R(27000));
    expect(gstr3b.itcAvailable.cgst).toBe(R(18000));
    expect(gstr3b.itcAvailable.sgst).toBe(R(18000));
    // (27000 − 18000) on each of CGST and SGST.
    expect(gstr3b.setOff.totalCashPayable).toBe(R(18000));
  });

  it("reports a sale without a buyer GSTIN under B2C, not B2B", () => {
    const gstr1 = buildGstr1(entries, YEAR);
    expect(gstr1.b2b).toHaveLength(0);
    expect(gstr1.b2cSummary).toHaveLength(1);
    expect(gstr1.b2cSummary[0].rate).toBe(18);
    expect(gstr1.b2cSummary[0].taxableValue).toBe(R(300000));
  });

  it("reports a registered buyer invoice under B2B with its HSN", () => {
    const b2bEntries = [
      post({
        kind: "SALE",
        date: "2025-07-01",
        amount: R(50000),
        paymentMode: "CREDIT",
        gst: {
          rate: 12,
          placeOfSupply: KARNATAKA,
          counterpartyGstin: "29AABCU9603R1ZM",
          counterpartyName: "Anand Traders",
          hsnCode: "6109",
          invoiceNo: "INV-101",
        },
      }),
    ];
    const gstr1 = buildGstr1(b2bEntries, YEAR);
    expect(gstr1.b2b).toHaveLength(1);
    expect(gstr1.b2b[0].invoiceNo).toBe("INV-101");
    expect(gstr1.b2b[0].igst).toBe(R(6000));
    expect(gstr1.b2b[0].invoiceValue).toBe(R(56000));
    expect(gstr1.hsnSummary[0].hsnCode).toBe("6109");
  });

  it("keeps blocked credit out of the claimable pool", () => {
    const blocked = [
      post({
        kind: "PURCHASE",
        date: "2025-08-01",
        amount: R(10000),
        paymentMode: "CASH",
        gst: { rate: 18, placeOfSupply: TAMIL_NADU, itcEligible: false },
      }),
    ];
    const gstr3b = buildGstr3b(blocked, YEAR);
    expect(gstr3b.itcAvailable.cgst).toBe(0);
    expect(gstr3b.itcIneligible.cgst).toBe(R(900));
  });
});

/* ================================================================== */
/* Income tax                                                          */
/* ================================================================== */

describe("income tax", () => {
  it("charges nothing below the new-regime basic exemption", () => {
    expect(computeIncomeTax({ taxableIncome: R(350000) }).totalTax).toBe(0);
  });

  it("applies the Section 87A rebate up to the limit", () => {
    // ₹12,00,000: slab tax is 20000 + 40000 = ₹60,000, fully rebated.
    const result = computeIncomeTax({ taxableIncome: R(1200000) });
    expect(result.taxOnIncome).toBe(R(60000));
    expect(result.rebate87A).toBe(R(60000));
    expect(result.totalTax).toBe(0);
  });

  it("gives marginal relief just above the rebate limit", () => {
    // At ₹12,10,000 the extra tax must not exceed the extra ₹10,000 of income.
    const result = computeIncomeTax({ taxableIncome: R(1210000) });
    expect(result.totalTax).toBeLessThanOrEqual(R(10400));
    expect(result.totalTax).toBeGreaterThan(0);
  });

  it("computes slab tax and cess above the rebate limit", () => {
    // ₹16,00,000: 0 + 20000 + 40000 + 60000 = ₹1,20,000, plus 4% cess.
    const result = computeIncomeTax({ taxableIncome: R(1600000) });
    expect(result.taxAfterRebate).toBe(R(120000));
    expect(result.cess).toBe(R(4800));
    expect(result.totalTax).toBe(R(124800));
  });

  it("applies surcharge with marginal relief above ₹50 lakh", () => {
    const justOver = computeIncomeTax({ taxableIncome: R(5010000) });
    const justUnder = computeIncomeTax({ taxableIncome: R(5000000) });
    // Marginal relief caps the jump at roughly the extra income.
    expect(justOver.totalTax - justUnder.totalTax).toBeLessThan(R(11000));
    expect(justOver.marginalRelief).toBeGreaterThan(0);
  });

  it("computes old-regime tax with the age-based exemption", () => {
    const young = computeIncomeTax({ taxableIncome: R(600000), regime: "OLD", ageBand: "BELOW_60" });
    const senior = computeIncomeTax({ taxableIncome: R(600000), regime: "OLD", ageBand: "SENIOR" });
    // 12500 + 20000 = 32500, plus 4% cess.
    expect(young.taxAfterRebate).toBe(R(32500));
    // Senior citizens get ₹50,000 more exempt at 5%, saving ₹2,500.
    expect(senior.taxAfterRebate).toBe(R(30000));
  });

  it("identifies the cheaper regime", () => {
    const comparison = compareRegimes({ taxableIncome: R(1500000) });
    expect(comparison.cheaper).toBe("NEW");
    expect(comparison.saving).toBeGreaterThan(0);
  });

  it("computes presumptive income at 6% digital and 8% cash", () => {
    const result = computePresumptiveIncome({
      turnover: R(5000000),
      digitalTurnover: R(4000000),
    });
    expect(result.eligible).toBe(true);
    expect(result.deemedProfitDigital).toBe(R(240000));
    expect(result.deemedProfitCash).toBe(R(80000));
    expect(result.deemedProfit).toBe(R(320000));
  });

  it("drops the presumptive limit to ₹2 crore when cash receipts exceed 5%", () => {
    const cashHeavy = computePresumptiveIncome({
      turnover: R(25000000),
      digitalTurnover: R(10000000),
    });
    expect(cashHeavy.eligible).toBe(false);
    expect(cashHeavy.turnoverLimit).toBe(R(20000000));
  });

  it("builds the advance tax schedule at the statutory percentages", () => {
    const schedule = buildAdvanceTaxSchedule(R(100000), 2025);
    expect(schedule.required).toBe(true);
    expect(schedule.instalments.map((i) => i.cumulativePercent)).toEqual([15, 45, 75, 100]);
    expect(schedule.instalments[0].instalmentAmount).toBe(R(15000));
    expect(schedule.instalments[3].cumulativeAmount).toBe(R(100000));
    expect(
      schedule.instalments.reduce((sum, i) => sum + i.instalmentAmount, 0)
    ).toBe(R(100000));
  });

  it("does not require advance tax below the ₹10,000 threshold", () => {
    expect(buildAdvanceTaxSchedule(R(8000), 2025).required).toBe(false);
  });
});

/* ================================================================== */
/* Forecasting                                                         */
/* ================================================================== */

describe("revenue forecasting", () => {
  /** Twelve months of sales rising by a steady ₹5,000 a month. */
  function steadyGrowth(): JournalEntry[] {
    sequence = 0;
    const entries: JournalEntry[] = [];
    for (let month = 0; month < 12; month += 1) {
      const date = `2025-${String(month + 1).padStart(2, "0")}-15`;
      entries.push(
        post({
          kind: "SALE",
          date,
          amount: R(100000 + month * 5000),
          paymentMode: "CASH",
        })
      );
    }
    return entries;
  }

  it("aggregates net sales by month", () => {
    const points = monthlyNetSales(steadyGrowth());
    expect(points).toHaveLength(12);
    expect(points[0]).toEqual({ month: "2025-01", netSales: R(100000) });
    expect(points[11].netSales).toBe(R(155000));
  });

  it("nets sales returns out of the month they fall in", () => {
    sequence = 0;
    const entries = [
      post({ kind: "SALE", date: "2025-01-10", amount: R(100000), paymentMode: "CASH" }),
      post({ kind: "SALES_RETURN", date: "2025-01-20", amount: R(10000), paymentMode: "CASH" }),
    ];
    expect(monthlyNetSales(entries)[0].netSales).toBe(R(90000));
  });

  it("recovers a known linear trend exactly", () => {
    const model = fitTrend(monthlyNetSales(steadyGrowth()))!;
    expect(model.slope).toBeCloseTo(R(5000), 0);
    expect(model.intercept).toBeCloseTo(R(100000), 0);
    expect(model.rSquared).toBeCloseTo(1, 6);
  });

  it("projects the trend forward", () => {
    const forecast = forecastRevenue(steadyGrowth(), { horizonMonths: 3 });
    expect(forecast.confidence).toBe("good");
    expect(forecast.forecasts).toHaveLength(3);
    expect(forecast.forecasts[0].month).toBe("2026-01");
    // Month 12 of a series starting at 100000 and rising 5000 a month.
    expect(forecast.forecasts[0].forecast).toBeCloseTo(R(160000), -2);
    expect(forecast.projectedTotal).toBeGreaterThan(R(480000));
  });

  it("refuses to forecast from too little history", () => {
    sequence = 0;
    const thin = [post({ kind: "SALE", date: "2025-01-10", amount: R(1000), paymentMode: "CASH" })];
    const forecast = forecastRevenue(thin);
    expect(forecast.confidence).toBe("none");
    expect(forecast.forecasts).toHaveLength(0);
    expect(forecast.narrative).toContain("not enough history");
  });

  it("treats a month with no sales as a zero, not a gap", () => {
    sequence = 0;
    const gapped = [
      post({ kind: "SALE", date: "2025-01-10", amount: R(100000), paymentMode: "CASH" }),
      post({ kind: "SALE", date: "2025-04-10", amount: R(100000), paymentMode: "CASH" }),
    ];
    const forecast = forecastRevenue(gapped);
    expect(forecast.history.map((point) => point.month)).toEqual([
      "2025-01", "2025-02", "2025-03", "2025-04",
    ]);
    expect(forecast.history[1].netSales).toBe(0);
  });
});
