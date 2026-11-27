import { screen } from "@testing-library/react";
import CheckoutCompletePage from "../CheckoutCompletePage";
import { hat, renderWithProviders, signedInUser } from "../../../test/render";

const stripe = vi.hoisted(() => ({
  configured: true,
  retrievePaymentIntent: vi.fn(),
}));

vi.mock("../../../stripe/stripe.utils", () => ({
  get stripePromise() {
    return stripe.configured
      ? Promise.resolve({ retrievePaymentIntent: stripe.retrievePaymentIntent })
      : null;
  },
}));

const cart = { cartItems: [{ ...hat, quantity: 2 }], hidden: true };
const returnUrl =
  "/checkout/complete?payment_intent=pi_1&payment_intent_client_secret=pi_1_secret&redirect_status=succeeded";

const renderPage = (route = returnUrl, signedIn = false) =>
  renderWithProviders(<CheckoutCompletePage />, {
    route,
    state: { cart, ...(signedIn && { user: signedInUser }) },
  });

const intent = (fields: Record<string, unknown>) =>
  stripe.retrievePaymentIntent.mockResolvedValue({
    paymentIntent: { amount: 5000, ...fields },
  });

describe("CheckoutCompletePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stripe.configured = true;
  });

  it("asks Stripe how the payment went, then thanks the shopper", async () => {
    intent({ status: "succeeded" });
    const { store } = renderPage(returnUrl, true);

    expect(
      await screen.findByRole("heading", { name: "Thank you for your order" }),
    ).toBeInTheDocument();
    expect(stripe.retrievePaymentIntent).toHaveBeenCalledWith("pi_1_secret");
    expect(
      screen.getByText("Your payment of €50 went through."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View your orders" }),
    ).toBeVisible();
    expect(store.getState().cart.cartItems).toEqual([]);
  });

  it("clears the cart while a bank payment is still clearing", async () => {
    intent({ status: "processing" });
    const { store } = renderPage();

    expect(
      await screen.findByText(/is being confirmed by your bank/),
    ).toBeInTheDocument();
    expect(store.getState().cart.cartItems).toEqual([]);
  });

  it("keeps the cart when the payment failed, whatever the URL says", async () => {
    intent({
      status: "requires_payment_method",
      last_payment_error: { message: "The bank declined the payment." },
    });
    const { store } = renderPage();

    expect(
      await screen.findByRole("heading", { name: "Payment not completed" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("The bank declined the payment."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to checkout" }),
    ).toHaveAttribute("href", "/checkout");
    expect(store.getState().cart.cartItems).toHaveLength(1);
  });

  it("explains when Stripe can't be reached", async () => {
    stripe.retrievePaymentIntent.mockRejectedValue(new Error("offline"));
    renderPage();

    expect(
      await screen.findByText(/We couldn't check your payment/),
    ).toBeInTheDocument();
  });

  it("sends visitors without a payment back to checkout", () => {
    renderPage("/checkout/complete");
    expect(screen.getByText("Navigated away")).toBeInTheDocument();
    expect(stripe.retrievePaymentIntent).not.toHaveBeenCalled();
  });
});
