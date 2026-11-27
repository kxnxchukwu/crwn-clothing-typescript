import { ReactElement } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../redux/hooks";
import { selectProducts } from "../../features/shop-slice";
import { ONE_SIZE, stockOf } from "../../catalogue/product";
import {
  addItem,
  clearItemFromCart,
  Item,
  removeCartItem,
} from "../../features/cart-slice";
import { formatPrice } from "../../utils/format";

// One cart line (photo, name, prices, quantity stepper, remove). Used by the
// cart drawer and the checkout page.
export default function CartLine({ item }: { item: Item }): ReactElement {
  const dispatch = useAppDispatch();
  const { name, imageUrl, price, quantity, size } = item;
  const product = useSelector(selectProducts).find((p) => p.id === item.id);
  // Don't let the cart ask for more than is in stock. Until products load,
  // leave it to the server's check at payment.
  const atStockLimit = product ? quantity >= stockOf(product, size) : false;
  const label = size === ONE_SIZE ? name : `${name}, size ${size}`;

  return (
    <li className="flex gap-4 py-4">
      <div className="h-24 w-20 shrink-0 overflow-hidden rounded-md bg-surface">
        <img src={imageUrl} alt="" className="size-full object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="mt-0.5 text-sm text-muted">
              {size !== ONE_SIZE && <>Size {size} · </>}
              {formatPrice(price)}
            </p>
          </div>
          <p className="text-sm font-medium tabular-nums">
            {formatPrice(price * quantity)}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div
            className="inline-flex h-8 items-center rounded-md border border-line"
            role="group"
            aria-label={`Quantity of ${label}`}
          >
            <button
              type="button"
              onClick={() => dispatch(removeCartItem({ item }))}
              className="inline-flex size-8 items-center justify-center text-muted transition-colors hover:text-foreground"
              aria-label={
                quantity === 1
                  ? `Remove ${label}`
                  : `Decrease quantity of ${label}`
              }
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-6 text-center text-sm tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => dispatch(addItem({ item, size }))}
              disabled={atStockLimit}
              title={atStockLimit ? "No more in stock" : undefined}
              className="inline-flex size-8 items-center justify-center text-muted transition-colors hover:text-foreground disabled:opacity-40 disabled:hover:text-muted"
              aria-label={`Increase quantity of ${label}`}
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => dispatch(clearItemFromCart({ item }))}
            className="inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:text-foreground"
            aria-label={`Remove ${label} from cart`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </li>
  );
}
