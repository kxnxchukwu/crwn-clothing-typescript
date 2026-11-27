import { FormEvent, ReactElement, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { Appearance, StripeError } from "@stripe/stripe-js";
import { useSelector } from "react-redux";
import { Info, LoaderCircle, Lock } from "lucide-react";
import { useAppDispatch } from "../../redux/hooks";
import {
  clearCart,
  selectCartItems,
  selectCartTotal,
} from "../../features/cart-slice";
import { selectCurrentUser } from "../../features/user-slice";
import { selectTheme } from "../../features/theme-slice";
import { stripePromise } from "../../stripe/stripe.utils";
import { auth } from "../../firebase/firebase.utils";
import { formatPrice } from "../../utils/format";

// Where Stripe sends shoppers back after a redirect-based payment method
// (a bank app, iDEAL, a 3-D Secure page on another site).
export const RETURN_PATH = "/checkout/complete";

// Shoppers can still pick another country in the form.
const DEFAULT_COUNTRY = "IE";

// The payment fields render in Stripe's iframe, so they can't read our CSS
// variables; mirror the light/dark token values here.
const tokens = {
  light: {
    theme: "stripe",
    background: "#ffffff",
    text: "#0a0a0a",
    muted: "#737373",
    line: "#e5e5e5",
    danger: "#dc2626",
  },
  dark: {
    theme: "night",
    background: "#0a0a0a",
    text: "#fafafa",
    muted: "#a3a3a3",
    line: "#262626",
    danger: "#f87171",
  },
} as const;

const appearanceFor = (mode: "light" | "dark"): Appearance => {
  const t = tokens[mode];
  return {
    theme: t.theme,
    variables: {
      colorPrimary: t.text,
      colorBackground: t.background,
      colorText: t.text,
      colorTextSecondary: t.muted,
      colorTextPlaceholder: t.muted,
      colorDanger: t.danger,
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      fontSizeBase: "15px",
      borderRadius: "6px",
    },
    rules: {
      ".Input": { borderColor: t.line, boxShadow: "none" },
      ".Input:focus": { borderColor: t.text, boxShadow: "none" },
      ".Tab": { borderColor: t.line, boxShadow: "none" },
      ".Tab--selected": { borderColor: t.text, boxShadow: "none" },
    },
  };
};

export type PaymentOutcome = "succeeded" | "processing";

interface PaymentFormProps {
  // The amount the server charged (euros), and whether it has settled yet.
  onComplete: (amount: number, outcome: PaymentOutcome) => void;
}

// Stripe's Payment Element: card, Apple Pay, Google Pay and whatever else is
// switched on in the Stripe dashboard. It renders before a PaymentIntent
// exists ("deferred intent"), so one is only created when the shopper pays.
export default function PaymentForm(props: PaymentFormProps): ReactElement {
  const total = useSelector(selectCartTotal);
  const theme = useSelector(selectTheme) === "dark" ? "dark" : "light";

  if (!stripePromise) {
    return (
      <p className="rounded-md border border-line bg-background p-4 text-sm text-muted">
        Payments aren&apos;t set up in this environment. Add
        VITE_STRIPE_PUBLISHABLE_KEY to enable them.
      </p>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: "payment",
        currency: "eur",
        // Shown in wallet sheets; the server still sets the real amount.
        amount: Math.round(total * 100),
        appearance: appearanceFor(theme),
        fonts: [
          {
            cssSrc:
              "https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap",
          },
        ],
      }}
    >
      <CheckoutForm {...props} />
    </Elements>
  );
}

// Only card and validation errors are safe and useful to show as they are.
const messageFor = (error: StripeError) =>
  (error.type === "card_error" || error.type === "validation_error") &&
  error.message
    ? error.message
    : "Your payment didn't go through. Please try again.";

function CheckoutForm({ onComplete }: PaymentFormProps): ReactElement {
  const dispatch = useAppDispatch();
  const stripe = useStripe();
  const elements = useElements();
  const amount = useSelector(selectCartTotal);
  const cartItems = useSelector(selectCartItems);
  const currentUser = useSelector(selectCurrentUser);
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paymentHandler = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);
    try {
      // Check the fields first, so an incomplete form never creates a payment.
      const submitted = await elements.submit();
      if (submitted.error) {
        setError(messageFor(submitted.error));
        return;
      }

      // Signed-in shoppers send their ID token so the order is saved to them.
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch(
        "/.netlify/functions/create-payment-intent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(idToken && { Authorization: `Bearer ${idToken}` }),
          },
          // Only ids and quantities: the server prices the order itself.
          body: JSON.stringify({
            items: cartItems.map(({ id, size, quantity }) => ({
              id,
              size,
              quantity,
            })),
          }),
        },
      );
      const data: { clientSecret?: string; amount?: number; error?: string } =
        await response.json().catch(() => ({}));
      if (!response.ok || !data.clientSecret) {
        setError(
          data.error
            ? `${data.error} Please try again.`
            : "We couldn't start your payment. Please try again.",
        );
        return;
      }
      const chargedAmount =
        typeof data.amount === "number" ? data.amount / 100 : amount;

      // Redirect-based methods leave the page here and come back to
      // RETURN_PATH; cards and wallets resolve in place.
      const result = await stripe.confirmPayment({
        elements,
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}${RETURN_PATH}`,
        },
        redirect: "if_required",
      });

      if (result.error) {
        setError(messageFor(result.error));
      } else if (
        result.paymentIntent.status === "succeeded" ||
        result.paymentIntent.status === "processing"
      ) {
        onComplete(chargedAmount, result.paymentIntent.status);
        dispatch(clearCart());
      } else {
        setError("Your payment didn't go through. Please try again.");
      }
    } catch {
      setError("We couldn't reach the payment service. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={paymentHandler} className="space-y-4" noValidate>
      <div className="flex gap-2 rounded-md border border-line bg-background p-3 text-xs text-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <p>
          Test mode: pay with card{" "}
          <span className="font-medium text-foreground tabular-nums">
            4242 4242 4242 4242
          </span>
          , any future expiry and any CVC.
        </p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Payment details</legend>
        <PaymentElement
          options={{
            layout: "tabs",
            defaultValues: {
              billingDetails: {
                // An Irish shop: start from Ireland rather than Stripe's IP
                // guess, which a VPN can turn into "United States" + ZIP.
                address: { country: DEFAULT_COUNTRY },
                ...(currentUser && {
                  name: currentUser.displayName,
                  email: currentUser.email,
                }),
              },
            },
          }}
          onReady={() => setIsReady(true)}
          onChange={() => setError(null)}
        />
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || !isReady || isProcessing}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isProcessing ? (
          <>
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Processing…
          </>
        ) : (
          <>
            <Lock className="size-4" aria-hidden="true" />
            Pay {formatPrice(amount)}
          </>
        )}
      </button>
    </form>
  );
}
