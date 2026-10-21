import { expect, test } from "@playwright/test";

// Sign-in page behaviour that never reaches Firebase.
test.describe("sign-in page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signin");
  });

  test("won't submit without an email and password", async ({ page }) => {
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    // The browser's required-field check stops the submit.
    await expect(page).toHaveURL(/\/signin$/);
    const emailValid = await page
      .getByLabel("Email")
      .evaluate((input: HTMLInputElement) => input.validity.valid);
    expect(emailValid).toBe(false);
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("shows and hides the password", async ({ page }) => {
    const password = page.getByLabel("Password", { exact: true });
    await password.fill("secret");
    await expect(password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(password).toHaveAttribute("type", "password");
  });

  test("switches between sign in and create account", async ({ page }) => {
    await page.getByRole("link", { name: "Create an account" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Create an account" }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Sign in", exact: true })
      .last()
      .click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Sign in" }),
    ).toBeVisible();
  });

  test("rejects unknown accounts with a plain message", async ({ page }) => {
    // A made-up address, so failed attempts never lock the real test account.
    await page
      .getByLabel("Email")
      .fill(`no-such-user-${Date.now()}@example.test`);
    await page.getByLabel("Password", { exact: true }).fill("wrong-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText(
      "Email or password is incorrect.",
    );
    await expect(page).toHaveURL(/\/signin$/);
  });
});

// A real sign-in with the dedicated test account (E2E_EMAIL / E2E_PASSWORD).
// Desktop only, to keep sign-ins against Firebase to one per run.
test.describe("signed-in journey", () => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  test.skip(!email || !password, "E2E_EMAIL / E2E_PASSWORD not set");
  test.skip(({ isMobile }) => isMobile, "Runs once, on desktop");

  test("signs in, sees orders, stays signed in, and signs out", async ({
    page,
  }) => {
    await page.goto("/signin");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password", { exact: true }).fill(password!);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page.getByText(/^Welcome back/)).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: "Orders" })).toBeVisible();
    await expect(
      header.getByRole("button", { name: "Sign out" }),
    ).toBeVisible();

    await header.getByRole("link", { name: "Orders" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Your orders" }),
    ).toBeVisible();
    // Either an empty state or a list — but never the error state.
    await expect(
      page
        .getByText("No orders yet")
        .or(page.getByText("Order placed").first()),
    ).toBeVisible();
    await expect(page.getByText(/couldn't load your orders/)).toHaveCount(0);

    // The session survives a reload.
    await page.reload();
    await expect(
      page.getByRole("heading", { level: 1, name: "Your orders" }),
    ).toBeVisible();
    await expect(
      header.getByRole("button", { name: "Sign out" }),
    ).toBeVisible();

    await header.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByText("You're signed out")).toBeVisible();
    await expect(page).toHaveURL(/\/signin$/);
    await expect(header.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Orders" })).toHaveCount(0);
  });
});
