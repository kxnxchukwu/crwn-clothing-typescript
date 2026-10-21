import { screen, within } from "@testing-library/react";
import { toast } from "sonner";
import ProductDetailsPage from "../ProductDetailsPage";
import { renderWithProviders, shopState } from "../../../test/render";

vi.mock(
  "../../../firebase/firebase.utils",
  async () => (await import("../../../test/firebase-mock")).firebaseUtilsMock,
);
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

const openProduct = (route: string, status = "succeeded" as const) =>
  renderWithProviders(<ProductDetailsPage />, {
    route,
    path: "/shop/:id/:productId",
    state: { shop: shopState(status) },
  });

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
      expect.objectContaining({ id: 1, quantity: 3 }),
    ]);
    expect(toast.success).toHaveBeenCalledWith(
      "3 × Brown Brim added to cart",
      expect.objectContaining({
        action: expect.objectContaining({ label: "View cart" }),
      }),
    );
  });

  it("keeps quantity between 1 and 10", async () => {
    const { user } = openProduct("/shop/hats/1");
    const decrease = screen.getByRole("button", { name: "Decrease quantity" });
    const increase = screen.getByRole("button", { name: "Increase quantity" });
    expect(decrease).toBeDisabled();

    for (let i = 0; i < 12; i++) await user.click(increase);
    expect(quantity()).toHaveTextContent("10");
    expect(increase).toBeDisabled();
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
