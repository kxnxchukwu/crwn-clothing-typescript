import { ReactElement, useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { CircleAlert } from "lucide-react";
import { useAppDispatch } from "../../redux/hooks";
import { clearCart } from "../../features/cart-slice";
import { stripePromise } from "../../stripe/stripe.utils";
import Spinner from "../../components/Spinner/Spinner";
import OrderConfirmation from "../../components/OrderConfirmation/OrderConfirmation";
import type { PaymentOutcome } from "../../components/PaymentForm/PaymentForm";

type Status =
  | { state: "loading" }
  | { state: "done"; amount: number; outcome: PaymentOutcome }
  | { state: "failed"; message: string };

// /checkout/complete: where Stripe sends shoppers back after a redirect-based
// payment (a bank app, iDEAL, a 3-D Secure page). Stripe adds the
// PaymentIntent's client secret to the URL; we ask Stripe how it went rather
// than trusting the redirect_status query param.
export default function CheckoutCompletePage(): ReactElement {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const clientSecret = searchParams.get("payment_intent_client_secret");
  const [status, setStatus] = useState<Status>({ state: "loading" });

  useEffect(() => {
    if (!clientSecret || !stripePromise) return;
    let cancelled = false;

    (async () => {
      try {
        const stripe = await stripePromise;
        const result = await stripe?.retrievePaymentIntent(clientSecret);
        if (cancelled) return;
        const intent = result?.paymentIntent;
        if (
          intent &&
          (intent.status === "succeeded" || intent.status === "processing")
        ) {
          dispatch(clearCart());
          setStatus({
            state: "done",
            amount: intent.amount / 100,
            outcome: intent.status,
          });
        } else {
          setStatus({
            state: "failed",
            message:
              intent?.last_payment_error?.message ??
              "Your payment didn't go through, and you haven't been charged.",
          });
        }
      } catch {
        if (!cancelled) {
          setStatus({
            state: "failed",
            message:
              "We couldn't check your payment. If you were charged, it will show in your orders shortly.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clientSecret, dispatch]);

  useEffect(() => {
    document.title = "Order complete — CRWN Clothing";
    return () => {
      document.title = "CRWN Clothing";
    };
  }, []);

  // Nothing to look up: someone opened this URL directly.
  if (!clientSecret || !stripePromise)
    return <Navigate to="/checkout" replace />;

  if (status.state === "loading") return <Spinner />;

  if (status.state === "done") {
    return (
      <OrderConfirmation amount={status.amount} outcome={status.outcome} />
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <CircleAlert className="size-12 text-danger" aria-hidden="true" />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        Payment not completed
      </h1>
      <p className="mt-3 text-muted">{status.message}</p>
      <Link
        to="/checkout"
        className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Back to checkout
      </Link>
    </div>
  );
}
