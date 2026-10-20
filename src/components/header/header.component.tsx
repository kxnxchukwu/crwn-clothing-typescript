import { ReactElement } from "react";
import Logo from "../../assets/crown.svg?react";
import ThemeToggler from "../theme-toggler/ThemeToggler.component";
import { useDispatch, useSelector } from "react-redux";
import CartIcon from "../cart-icon/cart-icon.component";
import CartDropdown from "../cart-dropdown/cart-dropdown.component";
import { selectCardHidden } from "../../features/cart-slice";
import { selectCurrentUser } from "../../features/user-reducer";
import {
  HeaderContainer,
  LogoContainer,
  OptionsContainer,
  OptionLink,
  OptionDiv,
} from "./header.styles";
import { signOutStart } from "../../features/user-reducer";
import { useLocation } from "react-router-dom";

export default function Header(): ReactElement {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const hidden = useSelector(selectCardHidden);
  const currentUser = useSelector(selectCurrentUser);
  return (
    <HeaderContainer>
      <LogoContainer to="/">
        <Logo className="logo" />
      </LogoContainer>
      <OptionsContainer className="options">
        <>
          <ThemeToggler />
        </>
        <OptionLink
          active={pathname === "/shop" ? "active" : undefined}
          to="/shop"
        >
          SHOP
        </OptionLink>
        <OptionLink
          active={pathname === "/contact" ? "active" : undefined}
          to="/contact"
        >
          CONTACT
        </OptionLink>
        {currentUser ? (
          <OptionDiv onClick={() => dispatch(signOutStart())}>
            SIGN OUT
          </OptionDiv>
        ) : (
          <OptionLink
            active={pathname === "/signin" ? "active" : undefined}
            to="signin"
          >
            SIGN IN
          </OptionLink>
        )}
        <CartIcon />
      </OptionsContainer>
      {hidden ? null : <CartDropdown />}
    </HeaderContainer>
  );
}
