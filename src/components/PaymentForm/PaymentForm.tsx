import { FormEvent, ReactElement, useState } from "react";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { StripeCardElementOptions } from "@stripe/stripe-js";
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

// The card field renders in Stripe's iframe, so it can't read our CSS
// variables; mirror the light/dark token values here.
const cardColors = {
  light: { text: "#0a0a0a", placeholder: "#737373", danger: "#dc2626" },
  dark: { text: "#fafafa", placeholder: "#a3a3a3", danger: "#f87171" },
};

interface PaymentFormProps {
  onSuccess: (amount: number) => void;
}

export default function PaymentForm({
  onSuccess,
}: PaymentFormProps): ReactElement {
  const dispatch = useAppDispatch();
  const stripe = useStripe();
  const elements = useElements();
  const amount = useSelector(selectCartTotal);
  const cartItems = useSelector(selectCartItems);
  const currentUser = useSelector(selectCurrentUser);
  const theme = useSelector(selectTheme) === "dark" ? "dark" : "light";
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardOptions: StripeCardElementOptions = {
    hidePostalCode: true,
    style: {
      base: {
        color: cardColors[theme].text,
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        fontSize: "15px",
        "::placeholder": { color: cardColors[theme].placeholder },
      },
      invalid: { color: cardColors[theme].danger },
    },
  };

  const paymentHandler = async (event: FormEvent) => {
    event.preventDefault();
    const card = elements?.getElement(CardElement);
    if (!stripe || !card) return;

    setIsProcessing(true);
    setError(null);
    try {
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
            items: cartItems.map(({ id, quantity }) => ({ id, quantity })),
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
      const { clientSecret } = data;
      const chargedAmount =
        typeof data.amount === "number" ? data.amount / 100 : amount;

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: { name: currentUser?.displayName ?? "Guest" },
        },
      });

      if (result.error) {
        setError(
          result.error.message ??
            "Your payment didn't go through. Please check your card details.",
        );
      } else if (result.paymentIntent.status === "succeeded") {
        onSuccess(chargedAmount);
        dispatch(clearCart());
      }
    } catch {
      setError("We couldn't reach the payment service. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!stripePromise) {
    return (
      <p className="rounded-md border border-line bg-background p-4 text-sm text-muted">
        Card payments aren't set up in this environment. Add
        VITE_STRIPE_PUBLISHABLE_KEY to enable them.
      </p>
    );
  }

  return (
    <form onSubmit={paymentHandler} className="space-y-4" noValidate>
      <div className="flex gap-2 rounded-md border border-line bg-background p-3 text-xs text-muted">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <p>
          Test mode: pay with card{" "}
          <span className="font-medium text-foreground tabular-nums">
            4242 4242 4242 4242
          </span>
          , expiry 12/29, CVC 123.
        </p>
      </div>

      <div>
        <label
          htmlFor="card-element"
          className="mb-2 block text-sm font-medium"
        >
          Card details
        </label>
        <div className="rounded-md border border-line bg-background px-3 py-3.5 focus-within:border-foreground">
          <CardElement
            id="card-element"
            options={cardOptions}
            onChange={() => setError(null)}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
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
