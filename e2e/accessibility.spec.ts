import { waitForContent } from "./helpers";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = [
  { name: "home", path: "/" },
  { name: "shop", path: "/shop" },
  { name: "collection", path: "/shop/hats" },
  { name: "product", path: "/shop/hats/1" },
  { name: "checkout", path: "/checkout" },
  { name: "sign in", path: "/signin" },
  { name: "sign up", path: "/signin?mode=signup" },
  { name: "not found", path: "/no-such-page" },
];

// Fail on serious and critical WCAG 2.1 AA issues.
const audit = async (page: Page) => {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  return results.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.help} (${v.nodes.length}×)`);
};

for (const theme of ["light", "dark"] as const) {
  test.describe(`${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      // Saved theme is applied before first paint from redux-persist's key.
      await page.addInitScript((t) => {
        localStorage.setItem(
          "persist:root",
          JSON.stringify({ theme: JSON.stringify({ theme: t }) }),
        );
      }, theme);
    });

    for (const { name, path } of pages) {
      test(`${name} has no serious accessibility violations`, async ({
        page,
      }) => {
        await page.goto(path);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.locator("main")).toBeVisible();
        await waitForContent(page);
        expect(await audit(page)).toEqual([]);
      });
    }

    test("cart drawer has no serious accessibility violations", async ({
      page,
    }) => {
      await page.goto("/shop/hats/1");
      await page.getByRole("button", { name: "Add to cart" }).click();
      await page.getByRole("button", { name: /^Cart, 1 item/ }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      expect(await audit(page)).toEqual([]);
    });
  });
}
