import { ReactElement } from "react";
import { Link } from "react-router";
import { useSelector } from "react-redux";
import { CircleCheck, Clock } from "lucide-react";
import { selectCurrentUser } from "../../features/user-slice";
import { formatPrice } from "../../utils/format";
import type { PaymentOutcome } from "../PaymentForm/PaymentForm";

interface OrderConfirmationProps {
  amount: number; // euros
  outcome: PaymentOutcome;
}

// The page after paying, whether the payment resolved on the checkout page
// or the shopper came back from a redirect.
export default function OrderConfirmation({
  amount,
  outcome,
}: OrderConfirmationProps): ReactElement {
  const currentUser = useSelector(selectCurrentUser);
  const Icon = outcome === "succeeded" ? CircleCheck : Clock;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <Icon className="size-12" aria-hidden="true" />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        Thank you for your order
      </h1>
      <p className="mt-3 text-muted">
        {outcome === "succeeded"
          ? `Your payment of ${formatPrice(amount)} went through.`
          : `Your payment of ${formatPrice(amount)} is being confirmed by your bank. We'll update your order as soon as it clears.`}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/shop"
          className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Continue shopping
        </Link>
        {currentUser && (
          <Link
            to="/orders"
            className="inline-flex h-11 items-center justify-center rounded-md border border-line px-6 text-sm font-medium transition-colors hover:bg-surface"
          >
            View your orders
          </Link>
        )}
      </div>
    </div>
  );
}
