import { ReactElement, useState } from "react";
import { Link } from "react-router";
import { useSelector } from "react-redux";
import { CircleCheck, ShoppingBag } from "lucide-react";
import {
  selectCartItems,
  selectCartItemsCount,
  selectCartTotal,
} from "../../features/cart-slice";
import CartLine from "../../components/cart-line/cart-line.component";
import PaymentForm from "../../components/payment-form/payment-form.component";
import { formatPrice } from "../../utils/format";

const primaryLinkClass =
  "inline-flex h-11 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90";

export default function CheckoutPage(): ReactElement {
  const total = useSelector(selectCartTotal);
  const cartItems = useSelector(selectCartItems);
  const itemCount = useSelector(selectCartItemsCount);
  const [paidAmount, setPaidAmount] = useState<number | null>(null);

  if (paidAmount !== null) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
        <CircleCheck className="size-12" aria-hidden="true" />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          Thank you for your order
        </h1>
        <p className="mt-3 text-muted">
          Your payment of {formatPrice(paidAmount)} went through.
        </p>
        <Link to="/shop" className={`${primaryLinkClass} mt-8`}>
          Continue shopping
        </Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
        <ShoppingBag className="size-12 text-muted" aria-hidden="true" />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          Your cart is empty
        </h1>
        <p className="mt-3 text-muted">
          Add a few things from the shop, then come back here to pay.
        </p>
        <Link to="/shop" className={`${primaryLinkClass} mt-8`}>
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Checkout
      </h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
        <section aria-labelledby="cart-items-heading">
          <h2 id="cart-items-heading" className="sr-only">
            Items in your cart
          </h2>
          <ul className="divide-y divide-line border-y border-line">
            {cartItems.map((item) => (
              <CartLine key={item.id} item={item} />
            ))}
          </ul>
          <Link
            to="/shop"
            className="mt-6 inline-block text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
          >
            Continue shopping
          </Link>
        </section>

        <section
          aria-labelledby="summary-heading"
          className="h-fit rounded-lg bg-surface p-6 lg:sticky lg:top-24"
        >
          <h2 id="summary-heading" className="text-lg font-semibold">
            Order summary
          </h2>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">
                Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
              </dt>
              <dd>{formatPrice(total)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
          <p className="mt-1 text-right text-xs text-muted">VAT included.</p>

          <div className="mt-8">
            <PaymentForm onSuccess={setPaidAmount} />
          </div>
        </section>
      </div>
    </div>
  );
}
