import type { Account } from "./types";

/**
 * The default chart of accounts seeded for every new retail store.
 *
 * Codes follow the conventional block layout so that sorting by code produces a
 * ledger in the order an accountant expects to read it:
 *
 *   1xxx assets · 2xxx liabilities · 3xxx equity
 *   4xxx income · 5xxx direct expenses (Trading A/c) · 6xxx indirect (P&L)
 *
 * The direct/indirect split at 5xxx/6xxx is what lets the Trading Account and
 * the Profit & Loss Account be derived without any per-report account lists.
 */
export const DEFAULT_CHART_OF_ACCOUNTS: Account[] = [
  /* ---------------------------------------------------------------- */
  /* 1xxx  Assets                                                      */
  /* ---------------------------------------------------------------- */
  {
    code: "1010",
    name: "Cash in Hand",
    type: "ASSET",
    group: "CURRENT_ASSET",
    isContra: false,
    isSystem: true,
    description: "Notes and coins in the till and the safe.",
  },
  {
    code: "1020",
    name: "Bank Account",
    type: "ASSET",
    group: "CURRENT_ASSET",
    isContra: false,
    isSystem: true,
    description: "Current account balance, including UPI and card settlements.",
  },
  {
    code: "1100",
    name: "Sundry Debtors",
    type: "ASSET",
    group: "CURRENT_ASSET",
    isContra: false,
    isSystem: true,
    description: "Customers who have taken goods on credit.",
  },
  {
    code: "1200",
    name: "Closing Stock",
    type: "ASSET",
    group: "CURRENT_ASSET",
    isContra: false,
    isSystem: true,
    description:
      "Value of unsold goods at period end. Set from the stock count, not by journal entry.",
  },
  {
    code: "1310",
    name: "Input CGST",
    type: "ASSET",
    group: "CURRENT_ASSET",
    isContra: false,
    isSystem: true,
    description: "Central GST paid on purchases, recoverable as input credit.",
  },
  {
    code: "1320",
    name: "Input SGST",
    type: "ASSET",
    group: "CURRENT_ASSET",
    isContra: false,
    isSystem: true,
    description: "State GST paid on purchases, recoverable as input credit.",
  },
  {
    code: "1330",
    name: "Input IGST",
    type: "ASSET",
    group: "CURRENT_ASSET",
    isContra: false,
    isSystem: true,
    description: "Integrated GST paid on inter-state purchases.",
  },
  {
    code: "1400",
    name: "Furniture & Fixtures",
    type: "ASSET",
    group: "FIXED_ASSET",
    isContra: false,
    isSystem: false,
    description: "Shelving, counters, display units.",
  },
  {
    code: "1410",
    name: "Shop Equipment",
    type: "ASSET",
    group: "FIXED_ASSET",
    isContra: false,
    isSystem: false,
    description: "Billing machines, refrigeration, weighing scales.",
  },
  {
    code: "1420",
    name: "Accumulated Depreciation",
    type: "ASSET",
    group: "FIXED_ASSET",
    isContra: true,
    isSystem: true,
    description: "Total depreciation written off against fixed assets to date.",
  },
  {
    code: "1500",
    name: "Prepaid Expenses",
    type: "ASSET",
    group: "CURRENT_ASSET",
    isContra: false,
    isSystem: false,
    description: "Rent or insurance paid in advance for a later period.",
  },
  {
    code: "1510",
    name: "Advance to Suppliers",
    type: "ASSET",
    group: "CURRENT_ASSET",
    isContra: false,
    isSystem: false,
  },

  /* ---------------------------------------------------------------- */
  /* 2xxx  Liabilities                                                 */
  /* ---------------------------------------------------------------- */
  {
    code: "2010",
    name: "Sundry Creditors",
    type: "LIABILITY",
    group: "CURRENT_LIABILITY",
    isContra: false,
    isSystem: true,
    description: "Suppliers from whom goods were bought on credit.",
  },
  {
    code: "2110",
    name: "Output CGST",
    type: "LIABILITY",
    group: "CURRENT_LIABILITY",
    isContra: false,
    isSystem: true,
    description: "Central GST collected on sales, payable to government.",
  },
  {
    code: "2120",
    name: "Output SGST",
    type: "LIABILITY",
    group: "CURRENT_LIABILITY",
    isContra: false,
    isSystem: true,
    description: "State GST collected on sales, payable to government.",
  },
  {
    code: "2130",
    name: "Output IGST",
    type: "LIABILITY",
    group: "CURRENT_LIABILITY",
    isContra: false,
    isSystem: true,
    description: "Integrated GST collected on inter-state sales.",
  },
  {
    code: "2200",
    name: "Salary Payable",
    type: "LIABILITY",
    group: "CURRENT_LIABILITY",
    isContra: false,
    isSystem: false,
    description: "Wages and salaries earned by staff but not yet paid.",
  },
  {
    code: "2210",
    name: "Rent Payable",
    type: "LIABILITY",
    group: "CURRENT_LIABILITY",
    isContra: false,
    isSystem: false,
  },
  {
    code: "2220",
    name: "Expenses Payable",
    type: "LIABILITY",
    group: "CURRENT_LIABILITY",
    isContra: false,
    isSystem: false,
    description: "Other expenses incurred but unpaid at period end.",
  },
  {
    code: "2300",
    name: "Loan Payable",
    type: "LIABILITY",
    group: "LONG_TERM_LIABILITY",
    isContra: false,
    isSystem: false,
    description: "Bank or private borrowings repayable beyond one year.",
  },

  /* ---------------------------------------------------------------- */
  /* 3xxx  Equity                                                      */
  /* ---------------------------------------------------------------- */
  {
    code: "3010",
    name: "Owner's Capital",
    type: "EQUITY",
    group: "CAPITAL",
    isContra: false,
    isSystem: true,
    description: "Money the owner has put into the business.",
  },
  {
    code: "3020",
    name: "Drawings",
    type: "EQUITY",
    group: "CAPITAL",
    isContra: true,
    isSystem: true,
    description:
      "Cash or goods taken by the owner for personal use. Reduces capital.",
  },
  {
    code: "3030",
    name: "Retained Earnings",
    type: "EQUITY",
    group: "CAPITAL",
    isContra: false,
    isSystem: true,
    description: "Accumulated profits of earlier years carried forward.",
  },

  /* ---------------------------------------------------------------- */
  /* 4xxx  Income                                                      */
  /* ---------------------------------------------------------------- */
  {
    code: "4010",
    name: "Sales",
    type: "INCOME",
    group: "DIRECT_INCOME",
    isContra: false,
    isSystem: true,
    description: "Revenue from goods sold, excluding GST collected.",
  },
  {
    code: "4020",
    name: "Sales Returns",
    type: "INCOME",
    group: "DIRECT_INCOME",
    isContra: true,
    isSystem: true,
    description: "Goods returned by customers. Deducted from sales.",
  },
  {
    code: "4100",
    name: "Discount Received",
    type: "INCOME",
    group: "INDIRECT_INCOME",
    isContra: false,
    isSystem: false,
    description: "Settlement discounts allowed by suppliers.",
  },
  {
    code: "4110",
    name: "Commission Received",
    type: "INCOME",
    group: "INDIRECT_INCOME",
    isContra: false,
    isSystem: false,
  },
  {
    code: "4120",
    name: "Interest Income",
    type: "INCOME",
    group: "INDIRECT_INCOME",
    isContra: false,
    isSystem: false,
  },
  {
    code: "4200",
    name: "Other Income",
    type: "INCOME",
    group: "INDIRECT_INCOME",
    isContra: false,
    isSystem: false,
    description: "Scrap sales, rent received, and other non-trading receipts.",
  },

  /* ---------------------------------------------------------------- */
  /* 5xxx  Direct expenses — Trading Account                           */
  /* ---------------------------------------------------------------- */
  {
    code: "5010",
    name: "Purchases",
    type: "EXPENSE",
    group: "DIRECT_EXPENSE",
    isContra: false,
    isSystem: true,
    description: "Cost of goods bought for resale, excluding GST paid.",
  },
  {
    code: "5020",
    name: "Purchase Returns",
    type: "EXPENSE",
    group: "DIRECT_EXPENSE",
    isContra: true,
    isSystem: true,
    description: "Goods returned to suppliers. Deducted from purchases.",
  },
  {
    code: "5030",
    name: "Carriage Inward",
    type: "EXPENSE",
    group: "DIRECT_EXPENSE",
    isContra: false,
    isSystem: false,
    description: "Freight on goods brought into the shop. A cost of stock.",
  },
  {
    code: "5040",
    name: "Wages",
    type: "EXPENSE",
    group: "DIRECT_EXPENSE",
    isContra: false,
    isSystem: false,
    description:
      "Wages of staff engaged directly in handling goods, charged to Trading A/c.",
  },
  {
    code: "5050",
    name: "Packing Charges",
    type: "EXPENSE",
    group: "DIRECT_EXPENSE",
    isContra: false,
    isSystem: false,
  },

  /* ---------------------------------------------------------------- */
  /* 6xxx  Indirect expenses — Profit & Loss Account                   */
  /* ---------------------------------------------------------------- */
  {
    code: "6010",
    name: "Salaries",
    type: "EXPENSE",
    group: "INDIRECT_EXPENSE",
    isContra: false,
    isSystem: true,
    description: "Salaries of counter, administrative and management staff.",
  },
  {
    code: "6020",
    name: "Rent",
    type: "EXPENSE",
    group: "INDIRECT_EXPENSE",
    isContra: false,
    isSystem: true,
    description: "Shop rent.",
  },
  {
    code: "6030",
    name: "Electricity",
    type: "EXPENSE",
    group: "INDIRECT_EXPENSE",
    isContra: false,
    isSystem: false,
  },
  {
    code: "6040",
    name: "Telephone & Internet",
    type: "EXPENSE",
    group: "INDIRECT_EXPENSE",
    isContra: false,
    isSystem: false,
  },
  {
    code: "6050",
    name: "Repairs & Maintenance",
    type: "EXPENSE",
    group: "INDIRECT_EXPENSE",
    isContra: false,
    isSystem: false,
  },
  {
    code: "6060",
    name: "Insurance",
    type: "EXPENSE",
    group: "INDIRECT_EXPENSE",
    isContra: false,
    isSystem: false,
  },
  {
    code: "6070",
    name: "Advertising & Marketing",
    type: "EXPENSE",
    group: "INDIRECT_EXPENSE",
    isContra: false,
    isSystem: false,
  },
  {
    code: "6080",
    name: "Bank Charges",
    type: "EXPENSE",
    group: "INDIRECT_EXPENSE",
    isContra: false,
    isSystem: false,
    description: "Card settlement fees, cheque charges, account fees.",
  },
  {
    code: "6090",
    name: "Depreciation",
    type: "EXPENSE",
    group: "INDIRECT_EXPENSE",
    isContra: false,
    isSystem: true,
    description: "Wear and tear on fixed assets, charged at period end.",
  },
  {
    code: "6100",
    name: "Discount Allowed",
    type: "EXPENSE",
    group: "INDIRECT_EXPENSE",
    isContra: false,
    isSystem: false,
    description: "Settlement discounts given to customers.",
  },
  {
    code: "6110",
    name: "Carriage Outward",
    type: "EXPENSE",
    group: "INDIRECT_EXPENSE",
    isContra: false,
    isSystem: false,
    description: "Delivery cost of goods sent to customers.",
  },
  {
    code: "6120",
    name: "Printing & Stationery",
    type: "EXPENSE",
    group: "INDIRECT_EXPENSE",
    isContra: false,
    isSystem: false,
  },
  {
    code: "6130",
    name: "Professional Fees",
    type: "EXPENSE",
    group: "INDIRECT_EXPENSE",
    isContra: false,
    isSystem: false,
    description: "Accountant, auditor and legal fees.",
  },
  {
    code: "6140",
    name: "Bad Debts",
    type: "EXPENSE",
    group: "INDIRECT_EXPENSE",
    isContra: false,
    isSystem: false,
  },
  {
    code: "6200",
    name: "Miscellaneous Expenses",
    type: "EXPENSE",
    group: "INDIRECT_EXPENSE",
    isContra: false,
    isSystem: true,
    description: "Small sundry costs that do not warrant their own account.",
  },
];

/** Account codes the engine refers to by name. Renaming these breaks reports. */
export const SYSTEM_ACCOUNTS = {
  cash: "1010",
  bank: "1020",
  debtors: "1100",
  closingStock: "1200",
  inputCgst: "1310",
  inputSgst: "1320",
  inputIgst: "1330",
  accumulatedDepreciation: "1420",
  creditors: "2010",
  outputCgst: "2110",
  outputSgst: "2120",
  outputIgst: "2130",
  capital: "3010",
  drawings: "3020",
  retainedEarnings: "3030",
  sales: "4010",
  salesReturns: "4020",
  purchases: "5010",
  purchaseReturns: "5020",
  salaries: "6010",
  rent: "6020",
  depreciation: "6090",
  miscellaneous: "6200",
} as const;

/** The accounts that represent liquid funds, for Receipts & Payments. */
export const CASH_AND_BANK_CODES: string[] = [
  SYSTEM_ACCOUNTS.cash,
  SYSTEM_ACCOUNTS.bank,
];

export function buildAccountIndex(accounts: Account[]): Map<string, Account> {
  return new Map(accounts.map((account) => [account.code, account]));
}
