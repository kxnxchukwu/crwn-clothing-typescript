import { screen } from "@testing-library/react";
import SignInAndSignUpPage from "../SignInAndSignUpPage";
import { renderWithProviders } from "../../../test/render";

vi.mock(
  "../../../firebase/firebase.utils",
  async () => (await import("../../../test/firebase-mock")).firebaseUtilsMock,
);

const renderPage = (route: string) =>
  renderWithProviders(<SignInAndSignUpPage />, { route, path: "/signin" });

describe("SignInAndSignUpPage", () => {
  it("shows sign-in by default", () => {
    renderPage("/signin");
    expect(
      screen.getByRole("heading", { level: 1, name: "Sign in" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Confirm password")).toBeNull();
  });

  it("switches to sign-up and back", async () => {
    const { user } = renderPage("/signin");

    await user.click(screen.getByRole("link", { name: "Create an account" }));
    expect(
      screen.getByRole("heading", { level: 1, name: "Create an account" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Sign in" }));
    expect(
      screen.getByRole("heading", { level: 1, name: "Sign in" }),
    ).toBeInTheDocument();
  });

  it("opens sign-up directly from ?mode=signup", () => {
    renderPage("/signin?mode=signup");
    expect(
      screen.getByRole("heading", { level: 1, name: "Create an account" }),
    ).toBeInTheDocument();
  });
});
