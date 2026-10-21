import { ReactElement, useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Menu, User, X } from "lucide-react";
import Logo from "../../assets/crown.svg?react";
import ThemeToggler from "../theme-toggler/ThemeToggler.component";
import CartIcon from "../cart-icon/cart-icon.component";
import CartDrawer from "../cart-drawer/cart-drawer.component";
import { useAppDispatch } from "../../redux/hooks";
import { selectCurrentUser, signOut } from "../../features/user-slice";

const navLinks = [{ to: "/shop", label: "Shop" }];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm transition-colors hover:text-foreground ${
    isActive ? "font-medium text-foreground" : "text-muted"
  }`;

const iconButtonClass =
  "inline-flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface";

export default function Header(): ReactElement {
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const account = currentUser ? (
    <button
      type="button"
      onClick={async () => {
        const result = await dispatch(signOut());
        if (signOut.fulfilled.match(result)) {
          toast("You're signed out");
        } else {
          toast.error("Couldn't sign you out. Please try again.");
        }
      }}
      className="text-sm text-muted transition-colors hover:text-foreground"
    >
      Sign out
    </button>
  ) : (
    <NavLink to="/signin" className={navLinkClass}>
      Sign in
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/90 backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className={`${iconButtonClass} -ml-2 md:hidden`}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <Link
          to="/"
          className="flex items-center gap-2.5"
          aria-label="CRWN home"
        >
          <Logo
            className="h-6 w-auto text-foreground [&_path]:fill-current [&_polygon]:fill-current"
            aria-hidden="true"
          />
          <span className="text-sm font-semibold tracking-[0.25em]">CRWN</span>
        </Link>

        <nav className="ml-10 hidden items-center gap-8 md:flex">
          {navLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} className={navLinkClass}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <div className="mr-3 hidden md:block">{account}</div>
          <ThemeToggler className={iconButtonClass} />
          <CartIcon className={iconButtonClass} />
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-menu"
          className="border-t border-line px-4 py-4 sm:px-6 md:hidden"
        >
          <ul className="flex flex-col gap-4">
            {navLinks.map(({ to, label }) => (
              <li key={to}>
                <NavLink to={to} className={navLinkClass}>
                  {label}
                </NavLink>
              </li>
            ))}
            <li className="flex items-center gap-2 border-t border-line pt-4">
              <User className="size-4 text-muted" aria-hidden="true" />
              {account}
            </li>
          </ul>
        </nav>
      )}
      <CartDrawer />
    </header>
  );
}
