import { screen } from "@testing-library/react";
import { toast } from "sonner";
import SignIn from "../SignIn";
import { renderWithProviders } from "../../../test/render";
import {
  firebaseAuthMock,
  firebaseError,
  firebaseUtilsMock,
  profile,
} from "../../../test/firebase-mock";

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

const fillAndSubmit = async (
  user: ReturnType<typeof renderWithProviders>["user"],
) => {
  await user.type(screen.getByLabelText("Email"), "ada@example.test");
  await user.type(screen.getByLabelText("Password"), "correct horse");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
};

describe("SignIn", () => {
  beforeEach(() => vi.clearAllMocks());

  it("signs in with email and welcomes the user by first name", async () => {
    firebaseAuthMock.signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: "user-1" },
    });
    firebaseUtilsMock.createUserProfileDocument.mockResolvedValue(profile);
    const { store, user } = renderWithProviders(<SignIn />);

    await fillAndSubmit(user);

    expect(firebaseAuthMock.signInWithEmailAndPassword).toHaveBeenCalledWith(
      firebaseUtilsMock.auth,
      "ada@example.test",
      "correct horse",
    );
    expect(toast.success).toHaveBeenCalledWith("Welcome back, Ada");
    expect(store.getState().user.currentUser).toEqual(profile);
  });

  it("shows a plain-English error when the password is wrong", async () => {
    firebaseAuthMock.signInWithEmailAndPassword.mockRejectedValue(
      firebaseError("auth/invalid-credential"),
    );
    const { user } = renderWithProviders(<SignIn />);

    await fillAndSubmit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email or password is incorrect.",
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("treats closing the Google popup as a choice, not an error", async () => {
    firebaseAuthMock.signInWithPopup.mockRejectedValue(
      firebaseError("auth/popup-closed-by-user"),
    );
    const { user } = renderWithProviders(<SignIn />);

    await user.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );

    expect(firebaseAuthMock.signInWithPopup).toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("signs in with Google", async () => {
    firebaseAuthMock.signInWithPopup.mockResolvedValue({
      user: { uid: "user-1" },
    });
    firebaseUtilsMock.createUserProfileDocument.mockResolvedValue(profile);
    const { store, user } = renderWithProviders(<SignIn />);

    await user.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );

    expect(toast.success).toHaveBeenCalledWith("Welcome back, Ada");
    expect(store.getState().user.currentUser?.id).toBe("user-1");
  });

  it("toggles password visibility", async () => {
    const { user } = renderWithProviders(<SignIn />);
    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(password).toHaveAttribute("type", "password");
  });
});
