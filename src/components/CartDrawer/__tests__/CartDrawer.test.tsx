import { fireEvent, screen, within } from "@testing-library/react";
import CartDrawer from "../CartDrawer";
import { hat, jacket, renderWithProviders } from "../../../test/render";

vi.mock(
  "../../../firebase/firebase.utils",
  async () => (await import("../../../test/firebase-mock")).firebaseUtilsMock,
);

const openCart = (items = [{ ...hat, quantity: 2 }, jacket]) =>
  renderWithProviders(<CartDrawer />, {
    state: { cart: { cartItems: items, hidden: false } },
  });

const dialog = () => screen.getByRole("dialog", { hidden: true });

describe("CartDrawer", () => {
  it("opens with the items, count and subtotal", () => {
    openCart();
    expect(dialog()).toHaveAttribute("open");
    expect(
      screen.getByRole("heading", { name: "Your cart (3)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Brown Brim")).toBeInTheDocument();
    expect(screen.getByText("Black Jean Shearling")).toBeInTheDocument();
    expect(screen.getByText("€175")).toBeInTheDocument();
  });

  it("changes quantities and removes lines", async () => {
    const { store, user } = openCart();

    await user.click(
      screen.getByRole("button", { name: "Increase quantity of Brown Brim" }),
    );
    expect(store.getState().cart.cartItems[0].quantity).toBe(3);
    expect(screen.getByText("€200")).toBeInTheDocument();

    // At quantity 1 the minus button removes the line.
    await user.click(
      screen.getByRole("button", { name: "Remove Black Jean Shearling" }),
    );
    expect(screen.queryByText("Black Jean Shearling")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Remove Brown Brim from cart" }),
    );
    expect(store.getState().cart.cartItems).toEqual([]);
    expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
  });

  it("closes on Escape", () => {
    const { store } = openCart();

    fireEvent(dialog(), new Event("cancel", { cancelable: true }));
    expect(store.getState().cart.hidden).toBe(true);
    expect(dialog()).not.toHaveAttribute("open");
  });

  it("closes from the close button", async () => {
    const { store, user } = openCart();
    await user.click(screen.getByRole("button", { name: "Close cart" }));
    expect(store.getState().cart.hidden).toBe(true);
  });

  it("closes when the backdrop (the dialog itself) is clicked", () => {
    const { store } = openCart();
    fireEvent.click(dialog());
    expect(store.getState().cart.hidden).toBe(true);
  });

  it("doesn't close when clicking inside the panel", async () => {
    const { store, user } = openCart();
    await user.click(screen.getByText("Brown Brim"));
    expect(store.getState().cart.hidden).toBe(false);
  });

  it("goes to checkout and closes", async () => {
    const { store, user } = openCart();
    await user.click(
      within(dialog()).getByRole("button", { name: "Checkout" }),
    );
    expect(screen.getByText("Navigated away")).toBeInTheDocument();
    expect(store.getState().cart.hidden).toBe(true);
  });

  it("offers a way back to the shop when empty", () => {
    openCart([]);
    expect(
      screen.getByRole("link", { name: "Start shopping" }),
    ).toHaveAttribute("href", "/shop");
  });
});
