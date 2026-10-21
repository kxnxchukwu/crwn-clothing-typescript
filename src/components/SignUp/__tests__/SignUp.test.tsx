import { screen } from "@testing-library/react";
import { toast } from "sonner";
import SignUp from "../SignUp";
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

type User = ReturnType<typeof renderWithProviders>["user"];

const fill = async (
  user: User,
  {
    password = "secret123",
    confirm = password,
  }: { password?: string; confirm?: string } = {},
) => {
  await user.type(screen.getByLabelText("Name"), "Ada Lovelace");
  await user.type(screen.getByLabelText("Email"), "ada@example.test");
  await user.type(screen.getByLabelText("Password"), password);
  await user.type(screen.getByLabelText("Confirm password"), confirm);
  await user.click(screen.getByRole("button", { name: "Create account" }));
};

describe("SignUp", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects short passwords before contacting Firebase", async () => {
    const { user } = renderWithProviders(<SignUp />);
    await fill(user, { password: "abc" });

    expect(screen.getByText("Use at least 6 characters.")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(
      firebaseAuthMock.createUserWithEmailAndPassword,
    ).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords", async () => {
    const { user } = renderWithProviders(<SignUp />);
    await fill(user, { password: "secret123", confirm: "secret124" });

    expect(screen.getByText("Passwords don't match.")).toBeInTheDocument();
    expect(
      firebaseAuthMock.createUserWithEmailAndPassword,
    ).not.toHaveBeenCalled();
  });

  it("clears a field's error once it's edited", async () => {
    const { user } = renderWithProviders(<SignUp />);
    await fill(user, { password: "abc" });
    expect(screen.getByText("Use at least 6 characters.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Password"), "def");
    expect(
      screen.queryByText("Use at least 6 characters."),
    ).not.toBeInTheDocument();
  });

  it("creates the account and saves the display name", async () => {
    firebaseAuthMock.createUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: "user-1" },
    });
    firebaseUtilsMock.createUserProfileDocument.mockResolvedValue(profile);
    const { store, user } = renderWithProviders(<SignUp />);

    await fill(user);

    expect(firebaseUtilsMock.createUserProfileDocument).toHaveBeenCalledWith(
      { uid: "user-1" },
      { displayName: "Ada Lovelace" },
    );
    expect(toast.success).toHaveBeenCalledWith("Account created", {
      description: "You're signed in as ada@example.test.",
    });
    expect(store.getState().user.currentUser).toEqual(profile);
  });

  it("explains when the email is already registered", async () => {
    firebaseAuthMock.createUserWithEmailAndPassword.mockRejectedValue(
      firebaseError("auth/email-already-in-use"),
    );
    const { user } = renderWithProviders(<SignUp />);

    await fill(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "An account with this email already exists.",
    );
  });
});
