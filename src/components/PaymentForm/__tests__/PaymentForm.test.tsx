import { useEffect, type ReactNode } from "react";
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
  confirmPayment: vi.fn(),
  submit: vi.fn(),
  elementsOptions: undefined as unknown,
  paymentElementOptions: undefined as unknown,
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
  Elements: ({
    options,
    children,
  }: {
    options: unknown;
    children: ReactNode;
  }) => {
    stripe.elementsOptions = options;
    return <>{children}</>;
  },
  PaymentElement: ({
    options,
    onReady,
  }: {
    options: unknown;
    onReady: () => void;
  }) => {
    stripe.paymentElementOptions = options;
    useEffect(() => onReady(), [onReady]);
    return <div data-testid="payment-element" />;
  },
  useStripe: () => ({ confirmPayment: stripe.confirmPayment }),
  useElements: () => ({ submit: stripe.submit }),
}));

const fetchMock = vi.fn();
const respond = (status: number, body: unknown) =>
  fetchMock.mockResolvedValue({
    ok: status >= 200 && status < 300,
    json: async () => body,
  });

const cart = { cartItems: [{ ...hat, quantity: 2 }, jacket], hidden: true };

const renderForm = ({
  signedIn = false,
  theme = "light" as const,
}: { signedIn?: boolean; theme?: "light" | "dark" } = {}) => {
  const onComplete = vi.fn();
  const result = renderWithProviders(<PaymentForm onComplete={onComplete} />, {
    state: {
      cart,
      theme: { theme },
      ...(signedIn && { user: signedInUser }),
    },
  });
  return { ...result, onComplete };
};

const pay = (user: ReturnType<typeof renderForm>["user"]) =>
  user.click(screen.getByRole("button", { name: /^Pay/ }));

describe("PaymentForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    stripe.configured = true;
    stripe.submit.mockResolvedValue({});
    firebaseUtilsMock.auth.currentUser = null;
  });

  afterEach(() => vi.unstubAllGlobals());

  it("explains when payments aren't set up", () => {
    stripe.configured = false;
    renderForm();
    expect(
      screen.getByText(/Payments aren't set up in this environment/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Pay/ })).toBeNull();
  });

  it("sets up a euro payment for the cart total in cents", () => {
    renderForm();
    expect(stripe.elementsOptions).toMatchObject({
      mode: "payment",
      currency: "eur",
      amount: 17500,
      appearance: { theme: "stripe" },
    });
    expect(screen.getByRole("button", { name: "Pay €175" })).toBeEnabled();
  });

  it("matches the dark theme", () => {
    renderForm({ theme: "dark" });
    expect(stripe.elementsOptions).toMatchObject({
      appearance: {
        theme: "night",
        variables: { colorBackground: "#0a0a0a" },
      },
    });
  });

  it("starts guests in Ireland", () => {
    renderForm();
    expect(stripe.paymentElementOptions).toEqual({
      layout: "tabs",
      defaultValues: { billingDetails: { address: { country: "IE" } } },
    });
  });

  it("prefills a signed-in shopper's name and email", () => {
    renderForm({ signedIn: true });
    expect(stripe.paymentElementOptions).toMatchObject({
      defaultValues: {
        billingDetails: {
          name: "Ada Lovelace",
          email: "ada@example.test",
          address: { country: "IE" },
        },
      },
    });
  });

  it("stops at incomplete fields without starting a payment", async () => {
    stripe.submit.mockResolvedValue({
      error: {
        type: "validation_error",
        message: "Your card number is incomplete.",
      },
    });
    const { user } = renderForm();

    await pay(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your card number is incomplete.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends only item ids, sizes and quantities, never prices", async () => {
    respond(400, { error: "Your cart is empty." });
    const { user } = renderForm();

    await pay(user);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/.netlify/functions/create-payment-intent");
    expect(JSON.parse(init.body)).toEqual({
      items: [
        { id: 1, size: "One size", quantity: 2 },
        { id: 18, size: "L", quantity: 1 },
      ],
    });
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("attaches the Firebase ID token when signed in", async () => {
    firebaseUtilsMock.auth.currentUser = {
      getIdToken: async () => "id-token",
    };
    respond(400, { error: "Nope." });
    const { user } = renderForm({ signedIn: true });

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
    expect(stripe.confirmPayment).not.toHaveBeenCalled();
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
    stripe.confirmPayment.mockResolvedValue({
      error: { type: "card_error", message: "Your card was declined." },
    });
    const { store, user, onComplete } = renderForm();

    await pay(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your card was declined.",
    );
    expect(onComplete).not.toHaveBeenCalled();
    expect(store.getState().cart.cartItems).toHaveLength(2);
  });

  it("hides Stripe's internal errors behind a plain message", async () => {
    respond(200, { clientSecret: "pi_secret", amount: 17500 });
    stripe.confirmPayment.mockResolvedValue({
      error: { type: "api_error", message: "Internal: something odd" },
    });
    const { user } = renderForm();

    await pay(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your payment didn't go through. Please try again.",
    );
  });

  it("confirms with a return URL, then reports the charge and clears the cart", async () => {
    respond(200, { clientSecret: "pi_secret", amount: 17500 });
    stripe.confirmPayment.mockResolvedValue({
      paymentIntent: { status: "succeeded" },
    });
    const { store, user, onComplete } = renderForm({ signedIn: true });

    await pay(user);

    expect(stripe.confirmPayment).toHaveBeenCalledWith({
      elements: { submit: stripe.submit },
      clientSecret: "pi_secret",
      confirmParams: {
        return_url: `${window.location.origin}/checkout/complete`,
      },
      redirect: "if_required",
    });
    expect(onComplete).toHaveBeenCalledWith(175, "succeeded");
    expect(store.getState().cart.cartItems).toEqual([]);
  });

  it("treats a payment still clearing as placed", async () => {
    respond(200, { clientSecret: "pi_secret", amount: 17500 });
    stripe.confirmPayment.mockResolvedValue({
      paymentIntent: { status: "processing" },
    });
    const { store, user, onComplete } = renderForm();

    await pay(user);

    expect(onComplete).toHaveBeenCalledWith(175, "processing");
    expect(store.getState().cart.cartItems).toEqual([]);
  });
});
