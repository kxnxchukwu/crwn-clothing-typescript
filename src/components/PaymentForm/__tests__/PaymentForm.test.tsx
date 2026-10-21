import { screen } from "@testing-library/react";
import PaymentForm from "../PaymentForm";
import {
  hat,
  jacket,
  renderWithProviders,
  signedInUser,
} from "../../../test/render";
import { firebaseUtilsMock } from "../../../test/firebase-mock";

const stripe = vi.hoisted(() => ({
  configured: true,
  confirmCardPayment: vi.fn(),
}));

vi.mock(
  "../../../firebase/firebase.utils",
  async () => (await import("../../../test/firebase-mock")).firebaseUtilsMock,
);
vi.mock("../../../stripe/stripe.utils", () => ({
  get stripePromise() {
    return stripe.configured ? Promise.resolve({}) : null;
  },
}));
vi.mock("@stripe/react-stripe-js", () => ({
  CardElement: () => <div data-testid="card-element" />,
  useStripe: () => ({ confirmCardPayment: stripe.confirmCardPayment }),
  useElements: () => ({ getElement: () => ({ card: true }) }),
}));

const fetchMock = vi.fn();
const respond = (status: number, body: unknown) =>
  fetchMock.mockResolvedValue({
    ok: status >= 200 && status < 300,
    json: async () => body,
  });

const cart = { cartItems: [{ ...hat, quantity: 2 }, jacket], hidden: true };

const renderForm = (onSuccess = vi.fn(), signedIn = false) => {
  const result = renderWithProviders(<PaymentForm onSuccess={onSuccess} />, {
    state: { cart, ...(signedIn && { user: signedInUser }) },
  });
  return { ...result, onSuccess };
};

const pay = (user: ReturnType<typeof renderForm>["user"]) =>
  user.click(screen.getByRole("button", { name: /^Pay/ }));

describe("PaymentForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    stripe.configured = true;
    firebaseUtilsMock.auth.currentUser = null;
  });

  afterEach(() => vi.unstubAllGlobals());

  it("explains when payments aren't set up", () => {
    stripe.configured = false;
    renderForm();
    expect(
      screen.getByText(/Card payments aren't set up in this environment/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Pay/ })).toBeNull();
  });

  it("shows the cart total on the pay button", () => {
    renderForm();
    expect(screen.getByRole("button", { name: "Pay €175" })).toBeEnabled();
  });

  it("sends only item ids and quantities, never prices", async () => {
    respond(400, { error: "Your cart is empty." });
    const { user } = renderForm();

    await pay(user);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/.netlify/functions/create-payment-intent");
    expect(JSON.parse(init.body)).toEqual({
      items: [
        { id: 1, quantity: 2 },
        { id: 18, quantity: 1 },
      ],
    });
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("attaches the Firebase ID token when signed in", async () => {
    firebaseUtilsMock.auth.currentUser = {
      getIdToken: async () => "id-token",
    };
    respond(400, { error: "Nope." });
    const { user } = renderForm(vi.fn(), true);

    await pay(user);

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer id-token",
    );
  });

  it("shows the server's error and re-enables the button", async () => {
    respond(400, { error: "An item in your cart is no longer available." });
    const { user } = renderForm();

    await pay(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "An item in your cart is no longer available. Please try again.",
    );
    expect(screen.getByRole("button", { name: "Pay €175" })).toBeEnabled();
    expect(stripe.confirmCardPayment).not.toHaveBeenCalled();
  });

  it("recovers when the payment service can't be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const { user } = renderForm();

    await pay(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't reach the payment service. Please try again.",
    );
    expect(screen.getByRole("button", { name: "Pay €175" })).toBeEnabled();
  });

  it("shows Stripe's message when the card is declined", async () => {
    respond(200, { clientSecret: "pi_secret", amount: 17500 });
    stripe.confirmCardPayment.mockResolvedValue({
      error: { message: "Your card was declined." },
    });
    const { store, user, onSuccess } = renderForm();

    await pay(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your card was declined.",
    );
    expect(onSuccess).not.toHaveBeenCalled();
    expect(store.getState().cart.cartItems).toHaveLength(2);
  });

  it("reports the amount the server charged and clears the cart", async () => {
    respond(200, { clientSecret: "pi_secret", amount: 17500 });
    stripe.confirmCardPayment.mockResolvedValue({
      paymentIntent: { status: "succeeded" },
    });
    const { store, user, onSuccess } = renderForm(vi.fn(), true);

    await pay(user);

    expect(stripe.confirmCardPayment).toHaveBeenCalledWith("pi_secret", {
      payment_method: {
        card: { card: true },
        billing_details: { name: "Ada Lovelace" },
      },
    });
    expect(onSuccess).toHaveBeenCalledWith(175);
    expect(store.getState().cart.cartItems).toEqual([]);
  });
});
