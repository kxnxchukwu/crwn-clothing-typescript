import { authErrorMessage } from "../auth-errors";

describe("authErrorMessage", () => {
  it("maps Firebase codes to plain-English messages", () => {
    expect(authErrorMessage("Firebase: Error (auth/invalid-credential).")).toBe(
      "Email or password is incorrect.",
    );
    expect(
      authErrorMessage("Firebase: Error (auth/email-already-in-use)."),
    ).toBe("An account with this email already exists.");
  });

  it("ignores a closed Google popup", () => {
    expect(
      authErrorMessage("Firebase: Error (auth/popup-closed-by-user)."),
    ).toBeNull();
  });

  it("falls back to a generic message", () => {
    expect(authErrorMessage("boom")).toBe(
      "Something went wrong. Please try again.",
    );
    expect(authErrorMessage(undefined)).toBe(
      "Something went wrong. Please try again.",
    );
  });
});
