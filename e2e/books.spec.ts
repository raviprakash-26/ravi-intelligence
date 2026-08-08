import { expect, test, type Page } from "@playwright/test";

/**
 * End-to-end walk through a shopkeeper's first week.
 *
 * The point of this suite is not that the pages render — it is that a
 * transaction entered through the form actually reaches the ledger and comes
 * back out the other end as the right number on every statement. The expected
 * figures below were worked out by hand.
 */

/** Each run registers its own store, so tests never collide over shared data. */
function uniqueEmail(): string {
  return `owner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function registerStore(page: Page, storeName: string): Promise<string> {
  const email = uniqueEmail();

  await page.goto("/books/register");
  await page.getByLabel("Store name").fill(storeName);
  await page.getByLabel("Your name").fill("Anand Kumar");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("shopkeeper2025");
  await page.getByLabel("State").selectOption("33"); // Tamil Nadu
  await page.getByRole("button", { name: /create my store/i }).click();

  await page.waitForURL("**/books/dashboard", { timeout: 20000 });
  return email;
}

/** Fills and submits the transaction form, waiting for the confirmation. */
async function recordTransaction(
  page: Page,
  options: {
    kind: string;
    amount: string;
    note?: string;
    gst?: { rate: string; placeOfSupply?: string };
    expenseAccount?: string;
    paymentMode?: "Cash" | "Bank / UPI" | "On credit" | "Supplier credit" | "Not yet paid";
  }
) {
  await page.goto("/books/transactions/new");
  await page.getByRole("button", { name: options.kind, exact: false }).first().click();

  await page.getByLabel(/amount|value returned/i).first().fill(options.amount);

  if (options.expenseAccount) {
    await page.getByLabel("Which expense?").selectOption({ label: options.expenseAccount });
  }

  if (options.paymentMode) {
    await page.getByRole("button", { name: options.paymentMode, exact: true }).click();
  }

  if (options.gst) {
    await page.getByLabel("This transaction has GST").check();
    await page.getByLabel("GST rate").selectOption(options.gst.rate);
    if (options.gst.placeOfSupply) {
      await page.locator("#placeOfSupply").selectOption(options.gst.placeOfSupply);
    }
  }

  if (options.note) {
    await page.getByLabel("Note").fill(options.note);
  }

  await page.getByRole("button", { name: /record transaction/i }).click();
  await expect(page.getByRole("status")).toContainText(/recorded as/i, { timeout: 15000 });
}

test.describe("books", () => {
  test("landing page invites a shopkeeper to start", async ({ page }) => {
    await page.goto("/books");
    await expect(
      page.getByRole("heading", { name: /accountant and auditor/i })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /start a free 14-day trial/i }).first()).toBeVisible();
  });

  test("signed-out visitors cannot reach the books", async ({ page }) => {
    await page.goto("/books/dashboard");
    await page.waitForURL("**/books/login**");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("registration creates a store with a seeded chart of accounts", async ({ page }) => {
    await registerStore(page, "Anand Provision Stores");

    await expect(page.locator("aside").getByText("Anand Provision Stores")).toBeVisible();
    await expect(page.getByText(/your books are ready and empty/i)).toBeVisible();

    // The chart of accounts is created as part of registration, not on demand.
    await page.goto("/books/settings");
    await expect(page.getByText("Cash in Hand").first()).toBeVisible();
    await expect(page.getByText("Output CGST").first()).toBeVisible();
  });

  test("rejects a GSTIN whose check digit is wrong", async ({ page }) => {
    await page.goto("/books/register");
    await page.getByLabel("Store name").fill("Bad GSTIN Store");
    await page.getByLabel("Your name").fill("Test Owner");
    await page.getByLabel("Email").fill(uniqueEmail());
    await page.getByLabel("Password").fill("shopkeeper2025");
    await page.getByLabel("State").selectOption("33");
    // Correct format, deliberately wrong final check character.
    await page.getByLabel("GSTIN").fill("33AABCU9603R1ZA");
    await page.getByRole("button", { name: /create my store/i }).click();

    await expect(page.getByText(/check digit does not match/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(page).toHaveURL(/\/books\/register/);
  });

  test("a weak password is refused", async ({ page }) => {
    await page.goto("/books/register");
    await page.getByLabel("Store name").fill("Weak Password Store");
    await page.getByLabel("Your name").fill("Test Owner");
    await page.getByLabel("Email").fill(uniqueEmail());
    await page.getByLabel("Password").fill("abc");
    await page.getByLabel("State").selectOption("33");
    await page.getByRole("button", { name: /create my store/i }).click();

    await expect(page.getByText(/at least 10 characters/i)).toBeVisible({ timeout: 15000 });
  });

  test("the entry preview shows the double entry before saving", async ({ page }) => {
    await registerStore(page, "Preview Store");
    await page.goto("/books/transactions/new");

    await page.getByRole("button", { name: "Sale", exact: false }).first().click();
    await page.getByLabel(/sale amount/i).fill("1000");
    await page.getByLabel("This transaction has GST").check();
    await page.getByLabel("GST rate").selectOption("18");

    const preview = page.locator("aside");
    // ₹1,000 plus 18% intra-state GST: cash 1180, sales 1000, CGST and SGST 90 each.
    await expect(preview.getByText("₹1,180.00").first()).toBeVisible();
    await expect(preview.getByText("₹1,000.00").first()).toBeVisible();
    await expect(preview.getByText("₹90.00").first()).toBeVisible();
    await expect(preview.getByText(/debits and credits agree/i)).toBeVisible();
  });

  test("the preview switches to IGST for an out-of-state sale", async ({ page }) => {
    await registerStore(page, "Interstate Store");
    await page.goto("/books/transactions/new");

    await page.getByRole("button", { name: "Sale", exact: false }).first().click();
    await page.getByLabel(/sale amount/i).fill("1000");
    await page.getByLabel("This transaction has GST").check();
    await page.getByLabel("GST rate").selectOption("18");
    await page.locator("#placeOfSupply").selectOption("29"); // Karnataka

    const preview = page.locator("aside");
    await expect(preview.getByText("Output IGST")).toBeVisible();
    await expect(preview.getByText("₹180.00").first()).toBeVisible();
    await expect(preview.getByText(/IGST at 18% applies/i)).toBeVisible();
  });

  /**
   * The full scenario. Worked by hand:
   *   Purchases  2,00,000 + 18% GST on credit
   *   Sales      3,00,000 + 18% GST for cash
   *   Rent          20,000 cash · Salaries 30,000 cash
   *   Opening stock 1,00,000 · Closing stock 80,000
   *
   *   Gross profit = (3,00,000 + 80,000) − (1,00,000 + 2,00,000) = 80,000
   *   Net profit   = 80,000 − 50,000                             = 30,000
   *   GST in cash  = 54,000 output − 36,000 input                = 18,000
   */
  test("a full trading year produces correct final accounts", async ({ page }) => {
    test.slow();
    await registerStore(page, "Full Year Store");

    await recordTransaction(page, {
      kind: "Purchase",
      amount: "200000",
      note: "Stock bought for the season",
      paymentMode: "Supplier credit",
      gst: { rate: "18" },
    });

    await recordTransaction(page, {
      kind: "Sale",
      amount: "300000",
      note: "Counter sales",
      paymentMode: "Cash",
      gst: { rate: "18" },
    });

    await recordTransaction(page, {
      kind: "Expense",
      amount: "20000",
      note: "Shop rent",
      expenseAccount: "Rent",
      paymentMode: "Cash",
    });

    await recordTransaction(page, {
      kind: "Expense",
      amount: "30000",
      note: "Staff salaries",
      expenseAccount: "Salaries",
      paymentMode: "Cash",
    });

    // Record the stock count, without which gross profit is meaningless.
    await page.goto("/books/dashboard");
    await page.getByLabel("Stock on 1 April").fill("100000");
    await page.getByLabel("Stock on 31 March").fill("80000");
    await page.getByRole("button", { name: /save stock/i }).click();
    await expect(page.getByRole("status")).toContainText(/stock figures saved/i, {
      timeout: 15000,
    });

    // Declaring opening stock must also put it into the ledger, funded by
    // capital — otherwise it sits on the Balance Sheet as an unbacked asset.
    await page.goto("/books/reports/journal");
    await expect(page.getByText("OP-0001")).toBeVisible();
    await expect(
      page.getByText(/opening stock brought into the business/i)
    ).toBeVisible();

    // The trial balance must tie before any statement can be trusted.
    await page.goto("/books/reports/trial-balance");
    await expect(page.getByText(/the books tie/i)).toBeVisible();

    // Trading Account
    await page.goto("/books/reports/trading");
    await expect(page.getByText("₹80,000.00").first()).toBeVisible();

    // Profit & Loss
    await page.goto("/books/reports/profit-loss");
    await expect(page.getByText("₹30,000.00").first()).toBeVisible();

    // Balance Sheet must balance to the paise. Matched exactly, because the
    // explanatory footnote below the statement also mentions balancing.
    await page.goto("/books/reports/balance-sheet");
    await expect(page.getByText("The sheet balances", { exact: true })).toBeVisible();
    await expect(page.getByText(/does not balance/i)).toBeHidden();

    // Income & Expenditure surplus must equal the net profit.
    await page.goto("/books/reports/income-expenditure");
    await expect(
      page.getByText(/this agrees with your profit & loss account/i)
    ).toBeVisible();

    // Receipts & Payments reconciles to the cash actually in hand:
    // 3,54,000 received less 50,000 of expenses.
    await page.goto("/books/reports/receipts-payments");
    await expect(page.getByText("₹3,04,000.00").first()).toBeVisible();
  });

  test("GST returns compute the cash payable after input credit", async ({ page }) => {
    test.slow();
    await registerStore(page, "GST Store");

    await recordTransaction(page, {
      kind: "Purchase",
      amount: "200000",
      paymentMode: "Supplier credit",
      gst: { rate: "18" },
    });
    await recordTransaction(page, {
      kind: "Sale",
      amount: "300000",
      paymentMode: "Cash",
      gst: { rate: "18" },
    });

    await page.goto("/books/gst");

    // Output 54,000 less input 36,000 leaves 18,000 to pay in cash.
    await expect(page.getByText("₹54,000.00").first()).toBeVisible();
    await expect(page.getByText("₹36,000.00").first()).toBeVisible();
    await expect(page.getByText("₹18,000.00").first()).toBeVisible();
  });

  test("the journal and ledger reflect what was entered", async ({ page }) => {
    await registerStore(page, "Ledger Store");

    await recordTransaction(page, {
      kind: "Sale",
      amount: "5000",
      note: "Test sale for ledger",
      paymentMode: "Cash",
    });

    await page.goto("/books/reports/journal");
    await expect(page.getByText("Test sale for ledger")).toBeVisible();
    await expect(page.getByText("SL-0001")).toBeVisible();

    await page.goto("/books/reports/ledger");
    await expect(page.getByRole("link", { name: /Cash in Hand/i })).toBeVisible();
    await expect(page.getByText("5,000.00").first()).toBeVisible();
  });

  test("an entry can be deleted and the books stay consistent", async ({ page }) => {
    await registerStore(page, "Delete Store");

    await recordTransaction(page, {
      kind: "Sale",
      amount: "1000",
      note: "Mistaken entry",
      paymentMode: "Cash",
    });

    await page.goto("/books/transactions");
    await expect(page.getByText("Mistaken entry")).toBeVisible();

    await page.getByRole("button", { name: /delete SL-0001/i }).click();
    await expect(page.getByText("Mistaken entry")).toBeHidden({ timeout: 15000 });

    await page.goto("/books/reports/trial-balance");
    await expect(page.getByText(/nothing to balance yet/i)).toBeVisible();
  });

  test("sign out ends the session and sign in restores it", async ({ page }) => {
    const email = await registerStore(page, "Session Store");

    await page.getByRole("button", { name: /sign out/i }).first().click();
    await page.waitForURL("**/books/login**");

    // The session is gone, so the dashboard is no longer reachable.
    await page.goto("/books/dashboard");
    await page.waitForURL("**/books/login**");

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("shopkeeper2025");
    await page.getByRole("button", { name: /^sign in$/i }).click();

    await page.waitForURL("**/books/dashboard", { timeout: 20000 });
    await expect(page.locator("aside").getByText("Session Store")).toBeVisible();
  });

  test("a wrong password is rejected without revealing whether the email exists", async ({
    page,
  }) => {
    const email = await registerStore(page, "Auth Store");
    await page.getByRole("button", { name: /sign out/i }).first().click();
    await page.waitForURL("**/books/login**");

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("definitely-the-wrong-password");
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page.locator("form").getByRole("alert")).toContainText(
      "Email or password is incorrect"
    );

    // An address that was never registered gives exactly the same message.
    await page.getByLabel("Email").fill("nobody-here@example.com");
    await page.getByLabel("Password").fill("definitely-the-wrong-password");
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page.locator("form").getByRole("alert")).toContainText(
      "Email or password is incorrect"
    );
  });

  test("one store cannot see another store's books", async ({ browser }) => {
    const firstContext = await browser.newContext();
    const firstPage = await firstContext.newPage();
    await registerStore(firstPage, "Private Store A");
    await recordTransaction(firstPage, {
      kind: "Sale",
      amount: "777777",
      note: "Store A confidential sale",
      paymentMode: "Cash",
    });

    const secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();
    await registerStore(secondPage, "Private Store B");

    await secondPage.goto("/books/transactions");
    await expect(secondPage.getByText("Store A confidential sale")).toBeHidden();
    await expect(secondPage.getByText("₹7,77,777.00")).toBeHidden();
    await expect(secondPage.getByText(/nothing recorded yet/i)).toBeVisible();

    await firstContext.close();
    await secondContext.close();
  });
});
