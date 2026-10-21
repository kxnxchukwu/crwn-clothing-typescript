import { screen } from "@testing-library/react";
import { toast } from "sonner";
import Header from "../Header";
import { hat, renderWithProviders, signedInUser } from "../../../test/render";
import { firebaseAuthMock } from "../../../test/firebase-mock";

vi.mock(
  "../../../firebase/firebase.utils",
  async () => (await import("../../../test/firebase-mock")).firebaseUtilsMock,
);
vi.mock(
  "firebase/auth",
  async () => (await import("../../../test/firebase-mock")).firebaseAuthMock,
);
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

describe("Header", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows Sign in and no Orders link when signed out", () => {
    renderWithProviders(<Header />);
    expect(screen.getAllByRole("link", { name: "Sign in" })).not.toHaveLength(
      0,
    );
    expect(
      screen.queryByRole("link", { name: "Orders" }),
    ).not.toBeInTheDocument();
  });

  it("shows Orders and signs out when signed in", async () => {
    firebaseAuthMock.signOut.mockResolvedValue(undefined);
    const { store, user } = renderWithProviders(<Header />, {
      state: {
        user: signedInUser,
        cart: { cartItems: [{ ...hat, quantity: 2 }], hidden: true },
      },
    });
    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute(
      "href",
      "/orders",
    );

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(toast).toHaveBeenCalledWith("You're signed out");
    expect(store.getState().user.currentUser).toBeNull();
    // Signing out empties the cart.
    expect(store.getState().cart.cartItems).toEqual([]);
  });

  it("reports a failed sign-out", async () => {
    firebaseAuthMock.signOut.mockRejectedValue(new Error("offline"));
    const { store, user } = renderWithProviders(<Header />, {
      state: { user: signedInUser },
    });

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't sign you out. Please try again.",
    );
    expect(store.getState().user.currentUser).not.toBeNull();
  });

  it("opens and closes the mobile menu", async () => {
    const { user } = renderWithProviders(<Header />);
    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById("mobile-menu")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close menu" }));
    expect(document.getElementById("mobile-menu")).not.toBeInTheDocument();
  });

  it("shows the cart count and opens the drawer", async () => {
    const { store, user } = renderWithProviders(<Header />, {
      state: { cart: { cartItems: [{ ...hat, quantity: 2 }], hidden: true } },
    });

    await user.click(screen.getByRole("button", { name: "Cart, 2 items" }));

    expect(store.getState().cart.hidden).toBe(false);
  });

  it("toggles the theme", async () => {
    const { store, user } = renderWithProviders(<Header />, {
      state: { theme: { theme: "light" } },
    });

    await user.click(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    );

    expect(store.getState().theme.theme).toBe("dark");
    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toBeInTheDocument();
  });
});
