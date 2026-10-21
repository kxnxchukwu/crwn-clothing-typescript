import { expect, test } from "@playwright/test";

// Browse → product → cart → checkout, stopping before payment.
test("a shopper can find a product and reach checkout", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: /Everyday essentials/ }),
  ).toBeVisible();

  await page.getByRole("link", { name: /^hats\b/i }).click();
  await expect(page).toHaveURL(/\/shop\/hats$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/hats/i);

  // Open the first product in the collection.
  const firstProduct = page.locator("main a.font-medium").first();
  const productName = (await firstProduct.textContent())!.trim();
  await firstProduct.click();
  await expect(
    page.getByRole("heading", { level: 1, name: productName }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Increase quantity" }).click();
  await page.getByRole("button", { name: "Add to cart", exact: true }).click();
  await expect(
    page.getByText(`2 × ${productName} added to cart`),
  ).toBeVisible();

  await page.getByRole("button", { name: "View cart" }).click();
  const drawer = page.getByRole("dialog", { name: /Your cart/ });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByText(productName)).toBeVisible();
  await expect(drawer.getByRole("heading")).toHaveText("Your cart (2)");

  await drawer.getByRole("button", { name: "Checkout" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByText("Subtotal (2 items)")).toBeVisible();
  // CI builds have no Stripe key, so the form says payments aren't set up.
  await expect(
    page.getByText(/Card payments aren't set up|Card details/).first(),
  ).toBeVisible();
});

test("the cart drawer closes with Escape and keeps items", async ({ page }) => {
  await page.goto("/shop/hats");
  await page.locator("main a.font-medium").first().click();
  await page.getByRole("button", { name: "Add to cart", exact: true }).click();

  await page.getByRole("button", { name: /^Cart, 1 item/ }).click();
  const drawer = page.getByRole("dialog", { name: /Your cart/ });
  await expect(drawer).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();

  // The cart survives a reload (persisted), but the drawer starts closed.
  await page.reload();
  await expect(
    page.getByRole("button", { name: /^Cart, 1 item/ }),
  ).toBeVisible();
  await expect(drawer).toBeHidden();
});

test("product pages load directly and refresh without crashing", async ({
  page,
}) => {
  await page.goto("/shop/hats/1");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Something went wrong")).toBeHidden();
});

test("unknown pages show Not Found", async ({ page }) => {
  await page.goto("/shop/hats/999999");
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  await page.goto("/no-such-page");
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
});

test("/orders sends signed-out visitors to sign in", async ({ page }) => {
  await page.goto("/orders");
  await expect(page).toHaveURL(/\/signin$/);
});
