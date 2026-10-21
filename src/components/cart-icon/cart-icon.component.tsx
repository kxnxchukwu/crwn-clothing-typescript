import { ReactElement } from "react";
import { useSelector } from "react-redux";
import { ShoppingBag } from "lucide-react";
import { useAppDispatch } from "../../redux/hooks";
import { setCartOpen, selectCartItemsCount } from "../../features/cart-slice";

export default function CartIcon({
  className,
}: {
  className?: string;
}): ReactElement {
  const dispatch = useAppDispatch();
  const itemCount = useSelector(selectCartItemsCount);

  return (
    <button
      type="button"
      className={`relative ${className ?? ""}`}
      onClick={() => dispatch(setCartOpen(true))}
      aria-label={`Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
    >
      <ShoppingBag className="size-5" />
      {itemCount > 0 && (
        <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] leading-4 font-medium text-background">
          {itemCount}
        </span>
      )}
    </button>
  );
}
