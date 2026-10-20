import { ReactElement } from "react";
import { ShoppingIcon } from "../shopping-bag/ShoppingBag.component";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../redux/hooks";
import {
  toggleCartHidden,
  selectCartItemsCount,
} from "../../features/cart-slice";
import { CartIconContainer, ItemCount } from "./cart-icon.styles";

export default function CartIcon(): ReactElement {
  const dispatch = useAppDispatch();
  const itemCount = useSelector(selectCartItemsCount);
  const handleClick = () => {
    dispatch(toggleCartHidden());
  };

  return (
    <CartIconContainer onClick={handleClick}>
      <ShoppingIcon className="shopping-icon" />
      <ItemCount>{itemCount}</ItemCount>
    </CartIconContainer>
  );
}
