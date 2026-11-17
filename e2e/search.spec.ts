import { expect, test, type Page } from "@playwright/test";
import { waitForContent } from "./helpers";

const searchBox = (page: Page) =>
  page.getByRole("searchbox", { name: "Search products" });
const cards = (page: Page) => page.locator("main a.font-medium");
const prices = async (page: Page) =>
  (await page.locator("main .group span.shrink-0").allTextContents()).map(
    (text) => Number(text.replace(/[^\d.]/g, "")),
  );

test("search, sort and category all live in the URL", async ({ page }) => {
  await page.goto("/shop");
  await waitForContent(page);

  await searchBox(page).fill("jacket");
  await expect(page).toHaveURL(/\/shop\?q=jacket$/);
  await expect(page.getByText(/products? for “jacket”/)).toBeVisible();
  await expect(cards(page).first()).toBeVisible();

  await page
    .getByRole("combobox", { name: "Sort by" })
    .selectOption("price-desc");
  await expect(page).toHaveURL(/q=jacket&sort=price-desc/);
  // Poll: the grid re-renders just after the URL changes.
  await expect
    .poll(async () => {
      const shown = await prices(page);
      return (
        shown.length > 1 &&
        shown.join() === [...shown].sort((a, b) => b - a).join()
      );
    })
    .toBe(true);
  const sorted = await prices(page);

  // A shared link opens the same results, once the products have loaded.
  // Don't wait for every image and script: the assertions below wait for
  // what matters.
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(searchBox(page)).toHaveValue("jacket");
  await expect.poll(() => prices(page)).toEqual(sorted);
});

test("Back restores the previous search", async ({ page }) => {
  await page.goto("/shop");
  await waitForContent(page);
  await searchBox(page).fill("blue");
  await expect(page).toHaveURL(/q=blue/);

  await page
    .getByRole("navigation", { name: "Categories" })
    .getByRole("link", { name: "Hats" })
    .click();
  await expect(page).toHaveURL(/\/shop\/hats\?q=blue$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hats");

  await page.goBack();
  await expect(page).toHaveURL(/\/shop\?q=blue$/);
  await expect(searchBox(page)).toHaveValue("blue");
});

test("an empty category points to matches elsewhere", async ({ page }) => {
  await page.goto("/shop/hats?q=denim");
  await waitForContent(page);
  await expect(
    page.getByRole("heading", { name: "No products match “denim”" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Search all products" }).click();
  await expect(page).toHaveURL(/\/shop\?q=denim$/);
  await expect(cards(page).first()).toBeVisible();
});
