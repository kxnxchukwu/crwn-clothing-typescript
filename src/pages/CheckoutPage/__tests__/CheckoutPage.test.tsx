import { screen } from "@testing-library/react";
import CheckoutPage from "../CheckoutPage";
import {
  hat,
  jacket,
  renderWithProviders,
  signedInUser,
} from "../../../test/render";

vi.mock(
  "../../../firebase/firebase.utils",
  async () => (await import("../../../test/firebase-mock")).firebaseUtilsMock,
);
// The payment form has its own tests; here it just reports success.
vi.mock("../../../components/PaymentForm/PaymentForm", () => ({
  default: ({ onSuccess }: { onSuccess: (amount: number) => void }) => (
    <button type="button" onClick={() => onSuccess(175)}>
      Simulate payment
    </button>
  ),
}));

const cart = { cartItems: [{ ...hat, quantity: 2 }, jacket], hidden: true };

describe("CheckoutPage", () => {
  it("shows the items and order summary", () => {
    renderWithProviders(<CheckoutPage />, { state: { cart } });
    expect(screen.getByText("Brown Brim")).toBeInTheDocument();
    expect(screen.getByText("Black Jean Shearling")).toBeInTheDocument();
    expect(screen.getByText("Subtotal (3 items)")).toBeInTheDocument();
    expect(screen.getAllByText("€175")).toHaveLength(2);
  });

  it("invites shopping when the cart is empty", () => {
    renderWithProviders(<CheckoutPage />);
    expect(
      screen.getByRole("heading", { name: "Your cart is empty" }),
    ).toBeInTheDocument();
  });

  it("thanks a signed-in shopper and links to their orders", async () => {
    const { user } = renderWithProviders(<CheckoutPage />, {
      state: { cart, user: signedInUser },
    });

    await user.click(screen.getByRole("button", { name: "Simulate payment" }));

    expect(
      screen.getByRole("heading", { name: "Thank you for your order" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Your payment of €175 went through."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View your orders" }),
    ).toHaveAttribute("href", "/orders");
  });

  it("doesn't offer order history to guests", async () => {
    const { user } = renderWithProviders(<CheckoutPage />, {
      state: { cart },
    });
    await user.click(screen.getByRole("button", { name: "Simulate payment" }));
    expect(
      screen.queryByRole("link", { name: "View your orders" }),
    ).not.toBeInTheDocument();
  });
});
