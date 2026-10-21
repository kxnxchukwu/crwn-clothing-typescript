import { toast } from "sonner";
import { setCartOpen } from "../features/cart-slice";
import type { AppDispatch } from "../redux/store";

// Confirmation after adding from a product card or page, with a shortcut to
// open the cart drawer.
export const toastAddedToCart = (
  dispatch: AppDispatch,
  name: string,
  quantity = 1,
) =>
  toast.success(
    `${quantity > 1 ? `${quantity} × ` : ""}${name} added to cart`,
    {
      action: {
        label: "View cart",
        onClick: () => dispatch(setCartOpen(true)),
      },
    },
  );
