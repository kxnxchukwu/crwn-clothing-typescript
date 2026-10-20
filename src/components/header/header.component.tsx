import { ReactElement } from "react";
import Logo from "../../assets/crown.svg?react";
import ThemeToggler from "../theme-toggler/ThemeToggler.component";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../redux/hooks";
import CartIcon from "../cart-icon/cart-icon.component";
import CartDropdown from "../cart-dropdown/cart-dropdown.component";
import { selectCardHidden } from "../../features/cart-slice";
import { selectCurrentUser } from "../../features/user-slice";
import {
  HeaderContainer,
  LogoContainer,
  OptionsContainer,
  OptionLink,
  OptionDiv,
} from "./header.styles";
import { signOut } from "../../features/user-slice";
import { useLocation } from "react-router";

export default function Header(): ReactElement {
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
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
          <OptionDiv onClick={() => dispatch(signOut())}>
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
