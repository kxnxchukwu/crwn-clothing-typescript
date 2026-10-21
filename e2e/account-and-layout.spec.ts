import { waitForContent } from "./helpers";
import { expect, test } from "@playwright/test";

test("sign-up validates passwords before contacting Firebase", async ({
  page,
}) => {
  await page.goto("/signin");
  await page.getByRole("link", { name: "Create an account" }).click();
  await expect(page).toHaveURL(/mode=signup/);

  await page.getByLabel("Name").fill("Test Shopper");
  await page.getByLabel("Email").fill("shopper@example.test");
  await page.getByLabel("Password", { exact: true }).fill("abc");
  await page.getByLabel("Confirm password").fill("abd");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText("Use at least 6 characters.")).toBeVisible();
  await expect(page.getByText("Passwords don't match.")).toBeVisible();
});

test("dark mode toggles and survives a reload", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  const toggle = page.getByRole("button", { name: /Switch to (dark|light)/ });
  const startDark = (await html.getAttribute("data-theme")) === "dark";

  await toggle.click();
  await expect(html).toHaveAttribute(
    "data-theme",
    startDark ? "light" : "dark",
  );

  await page.reload();
  await expect(html).toHaveAttribute(
    "data-theme",
    startDark ? "light" : "dark",
  );
});

for (const path of [
  "/",
  "/shop",
  "/shop/hats",
  "/shop/hats/1",
  "/checkout",
  "/signin",
]) {
  test(`no horizontal scrolling on ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    await waitForContent(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("the mobile menu opens and closes on navigation", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "The menu button only shows on small screens");
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.locator("#mobile-menu");
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "Shop" }).click();
  await expect(page).toHaveURL(/\/shop$/);
  await expect(menu).toBeHidden();
});
