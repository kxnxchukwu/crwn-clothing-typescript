import { expect, type Page } from "@playwright/test";

// Firestore keeps a connection open, so "networkidle" never fires. Wait for
// the page's own content instead: main is visible and skeletons are gone.
export const waitForContent = async (page: Page) => {
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator("main .animate-pulse")).toHaveCount(0, {
    timeout: 15_000,
  });
};
