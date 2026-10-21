import { screen } from "@testing-library/react";
import { toast } from "sonner";
import CollectionItem from "../CollectionItem";
import { hat, renderWithProviders } from "../../../test/render";

vi.mock(
  "../../../firebase/firebase.utils",
  async () => (await import("../../../test/firebase-mock")).firebaseUtilsMock,
);
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

describe("CollectionItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("links the name to the product page and shows the price", () => {
    renderWithProviders(<CollectionItem item={hat} title="Hats" />);
    expect(screen.getByRole("link", { name: "Brown Brim" })).toHaveAttribute(
      "href",
      "/shop/hats/1",
    );
    expect(screen.getByText("€25")).toBeInTheDocument();
  });

  it("adds to the cart and confirms", async () => {
    const { store, user } = renderWithProviders(
      <CollectionItem item={hat} title="Hats" />,
    );

    await user.click(
      screen.getByRole("button", { name: "Add Brown Brim to cart" }),
    );

    expect(store.getState().cart.cartItems).toEqual([
      expect.objectContaining({ id: 1, quantity: 1 }),
    ]);
    expect(
      screen.getByRole("button", { name: "Brown Brim added to cart" }),
    ).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith(
      "Brown Brim added to cart",
      expect.anything(),
    );
  });
});
