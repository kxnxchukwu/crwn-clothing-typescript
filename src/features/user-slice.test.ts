import userReducer, {
  checkUserSession,
  selectIsSessionChecked,
} from "./user-slice";

vi.mock("../firebase/firebase.utils", () => ({}));

const asRoot = (user: ReturnType<typeof userReducer>) => ({ user });

describe("user slice session check", () => {
  it("is unknown until the first session check settles", () => {
    const initial = userReducer(undefined, { type: "@@INIT" });
    expect(selectIsSessionChecked(asRoot(initial))).toBe(false);

    const signedOut = userReducer(
      initial,
      checkUserSession.fulfilled(null, "req", undefined),
    );
    expect(selectIsSessionChecked(asRoot(signedOut))).toBe(true);
    expect(signedOut.currentUser).toBeNull();

    const failed = userReducer(
      initial,
      checkUserSession.rejected(null, "req", undefined, "offline"),
    );
    expect(selectIsSessionChecked(asRoot(failed))).toBe(true);
  });
});
