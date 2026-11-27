import { screen, within } from "@testing-library/react";
import { toast } from "sonner";
import ProductDetailsPage from "../ProductDetailsPage";
import {
  hat,
  jacket,
  renderWithProviders,
  shopState,
} from "../../../test/render";
import type { Item } from "../../../features/cart-slice";

vi.mock(
  "../../../firebase/firebase.utils",
  async () => (await import("../../../test/firebase-mock")).firebaseUtilsMock,
);
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

const openProduct = (
  route: string,
  status = "succeeded" as const,
  cart?: { cartItems: Item[]; hidden: boolean },
) =>
  renderWithProviders(<ProductDetailsPage />, {
    route,
    path: "/shop/:id/:productId",
    state: { shop: shopState(status), ...(cart && { cart }) },
  });

const stockStatus = () => screen.getByTestId("stock-status");

const quantity = () =>
  within(screen.getByRole("group", { name: "Quantity" })).getByText(/^\d+$/);

describe("ProductDetailsPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the product with breadcrumb, price and page title", () => {
    openProduct("/shop/hats/1");
    expect(
      screen.getByRole("heading", { level: 1, name: "Brown Brim" }),
    ).toBeInTheDocument();
    expect(screen.getByText("€25")).toBeInTheDocument();
    expect(
      screen.getByText("A wide-brimmed hat in warm brown."),
    ).toBeInTheDocument();
    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(
      within(breadcrumb).getByRole("link", { name: "Hats" }),
    ).toHaveAttribute("href", "/shop/hats");
    expect(document.title).toBe("Brown Brim — CRWN Clothing");
  });

  it("adds the chosen quantity to the cart", async () => {
    const { store, user } = openProduct("/shop/hats/1");
    const increase = screen.getByRole("button", { name: "Increase quantity" });
    await user.click(increase);
    await user.click(increase);
    expect(quantity()).toHaveTextContent("3");

    await user.click(screen.getByRole("button", { name: "Add to cart" }));

    expect(store.getState().cart.cartItems).toEqual([
      expect.objectContaining({ id: 1, size: "One size", quantity: 3 }),
    ]);
    expect(toast.success).toHaveBeenCalledWith(
      "3 × Brown Brim added to cart",
      expect.objectContaining({
        action: expect.objectContaining({ label: "View cart" }),
      }),
    );
  });

  it("keeps quantity between 1 and what's in stock", async () => {
    // 8 in stock, 2 already in the cart: 6 more can be added.
    const { user } = openProduct("/shop/hats/1", "succeeded", {
      cartItems: [{ ...hat, quantity: 2 }],
      hidden: true,
    });
    const decrease = screen.getByRole("button", { name: "Decrease quantity" });
    const increase = screen.getByRole("button", { name: "Increase quantity" });
    expect(decrease).toBeDisabled();

    for (let i = 0; i < 12; i++) await user.click(increase);
    expect(quantity()).toHaveTextContent("6");
    expect(increase).toBeDisabled();
  });

  it("asks for a size, then adds that size", async () => {
    const { store, user } = openProduct("/shop/jackets/18");
    const size = screen.getByRole("group", { name: "Size" });
    expect(stockStatus()).toHaveTextContent("Select a size.");
    expect(
      screen.getByRole("button", { name: "Select a size" }),
    ).toBeDisabled();

    // M is sold out: still listed, but can't be picked.
    expect(within(size).getByRole("radio", { name: "M" })).toBeDisabled();
    expect(
      within(size).getByRole("radio", { name: "M" }),
    ).toHaveAccessibleDescription("Sold out");

    await user.click(within(size).getByRole("radio", { name: "S" }));
    expect(stockStatus()).toHaveTextContent("Only 2 left in S.");
    await user.click(screen.getByRole("button", { name: "Add to cart" }));

    expect(store.getState().cart.cartItems).toEqual([
      expect.objectContaining({ id: 18, size: "S", quantity: 1 }),
    ]);
    expect(toast.success).toHaveBeenCalledWith(
      "Black Jean Shearling (S) added to cart",
      expect.anything(),
    );
  });

  it("stops adding once the cart holds every one in stock", async () => {
    const { user } = openProduct("/shop/jackets/18", "succeeded", {
      cartItems: [{ ...jacket, size: "S", quantity: 2 }],
      hidden: true,
    });
    await user.click(screen.getByRole("radio", { name: "S" }));
    expect(stockStatus()).toHaveTextContent("All 2 in S are in your cart.");
    expect(screen.getByRole("button", { name: "Add to cart" })).toBeDisabled();
  });

  it("says when a product is sold out in every size", () => {
    openProduct("/shop/hats/2");
    expect(stockStatus()).toHaveTextContent("Sold out in every size.");
    expect(screen.getByRole("button", { name: "Sold out" })).toBeDisabled();
  });

  it("lists other products from the collection", () => {
    openProduct("/shop/hats/1");
    const related = screen.getByRole("region", { name: "More from Hats" });
    expect(within(related).getByText("Blue Beanie")).toBeInTheDocument();
    expect(within(related).queryByText("Brown Brim")).not.toBeInTheDocument();
  });

  it("starts again at quantity 1 on another product", async () => {
    const { user } = openProduct("/shop/hats/1");
    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(quantity()).toHaveTextContent("2");

    await user.click(screen.getByRole("link", { name: "Blue Beanie" }));

    expect(
      screen.getByRole("heading", { level: 1, name: "Blue Beanie" }),
    ).toBeInTheDocument();
    expect(quantity()).toHaveTextContent("1");
  });

  it("shows Not Found for an unknown product", () => {
    openProduct("/shop/hats/999");
    expect(
      screen.getByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument();
  });

  it("shows a placeholder while products load", () => {
    openProduct("/shop/hats/1", "loading" as "succeeded");
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
  });
});
