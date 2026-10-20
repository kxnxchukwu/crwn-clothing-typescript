import { ReactElement, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useSelector } from "react-redux";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useAppDispatch } from "../../redux/hooks";
import {
  addItem,
  clearItemFromCart,
  Item,
  removeCartItem,
  selectCardHidden,
  selectCartItems,
  selectCartItemsCount,
  selectCartTotal,
  setCartOpen,
} from "../../features/cart-slice";
import { formatPrice } from "../../utils/format";

// Slide-out cart built on <dialog>: showModal() gives us a focus trap, Escape
// to close, and an inert page behind it without extra code.
export default function CartDrawer(): ReactElement {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOpen = !useSelector(selectCardHidden);
  const cartItems = useSelector(selectCartItems);
  const itemCount = useSelector(selectCartItemsCount);
  const total = useSelector(selectCartTotal);

  const close = () => dispatch(setCartOpen(false));

  // Open/close the dialog from Redux state, locking page scroll while open.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!isOpen) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  // Close when navigating (e.g. a link inside the drawer, or browser back).
  useEffect(() => {
    dispatch(setCartOpen(false));
  }, [pathname, dispatch]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="cart-heading"
      // Escape fires "cancel" synchronously; route it through Redux so the
      // store is the single source of truth (the "close" event is async).
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={close}
      // A click on the dialog element itself (not its panel) is the backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-md translate-x-full bg-background text-foreground transition-[translate,display,overlay] transition-discrete duration-300 ease-out backdrop:bg-black/40 open:translate-x-0 motion-reduce:transition-none starting:open:translate-x-full"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="cart-heading" className="text-base font-semibold">
            Your cart
            {itemCount > 0 && (
              <span className="ml-1.5 font-normal text-muted">
                ({itemCount})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={close}
            className="-mr-2 inline-flex size-10 items-center justify-center rounded-full transition-colors hover:bg-surface"
            aria-label="Close cart"
            autoFocus
          >
            <X className="size-5" />
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
            <ShoppingBag className="size-10 text-muted" aria-hidden="true" />
            <div>
              <p className="font-medium">Your cart is empty</p>
              <p className="mt-1 text-sm text-muted">
                Find something you like in the shop.
              </p>
            </div>
            <Link
              to="/shop"
              className="mt-2 inline-flex h-11 items-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {cartItems.map((item) => (
                <CartLine key={item.id} item={item} />
              ))}
            </ul>

            <div className="space-y-4 border-t border-line px-5 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm">Subtotal</span>
                <span className="text-base font-semibold">
                  {formatPrice(total)}
                </span>
              </div>
              <p className="text-xs text-muted">VAT included.</p>
              <button
                type="button"
                onClick={() => {
                  close();
                  navigate("/checkout");
                }}
                className="inline-flex h-11 w-full items-center justify-center rounded-md bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Checkout
              </button>
              <button
                type="button"
                onClick={close}
                className="w-full text-center text-sm text-muted transition-colors hover:text-foreground"
              >
                Continue shopping
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}

function CartLine({ item }: { item: Item }): ReactElement {
  const dispatch = useAppDispatch();
  const { name, imageUrl, price, quantity } = item;

  return (
    <li className="flex gap-4 py-4">
      <div className="h-24 w-20 shrink-0 overflow-hidden rounded-md bg-surface">
        <img src={imageUrl} alt="" className="size-full object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="mt-0.5 text-sm text-muted">{formatPrice(price)}</p>
          </div>
          <p className="text-sm font-medium tabular-nums">
            {formatPrice(price * quantity)}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div
            className="inline-flex h-8 items-center rounded-md border border-line"
            role="group"
            aria-label={`Quantity of ${name}`}
          >
            <button
              type="button"
              onClick={() => dispatch(removeCartItem({ item }))}
              className="inline-flex size-8 items-center justify-center text-muted transition-colors hover:text-foreground"
              aria-label={
                quantity === 1
                  ? `Remove ${name}`
                  : `Decrease quantity of ${name}`
              }
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-6 text-center text-sm tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => dispatch(addItem({ item }))}
              className="inline-flex size-8 items-center justify-center text-muted transition-colors hover:text-foreground"
              aria-label={`Increase quantity of ${name}`}
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => dispatch(clearItemFromCart({ item }))}
            className="inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:text-foreground"
            aria-label={`Remove ${name} from cart`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </li>
  );
}
