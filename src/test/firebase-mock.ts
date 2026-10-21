// Shared Firebase stand-ins for component tests. Use with:
//   vi.mock(".../firebase/firebase.utils", async () =>
//     (await import(".../test/firebase-mock")).firebaseUtilsMock);
//   vi.mock("firebase/auth", async () =>
//     (await import(".../test/firebase-mock")).firebaseAuthMock);
// then configure the vi.fn()s per test.

export const firebaseUtilsMock = {
  auth: { currentUser: null as { getIdToken: () => Promise<string> } | null },
  googleProvider: {},
  firestore: {},
  createUserProfileDocument: vi.fn(),
  getCurrentUser: vi.fn(async () => null),
  getCollections: vi.fn(),
};

export const firebaseAuthMock = {
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
};

export const profile = {
  id: "user-1",
  displayName: "Ada Lovelace",
  email: "ada@example.test",
  createdAt: null,
};

// Firebase rejects with messages like this; the app maps the code.
export const firebaseError = (code: string) =>
  new Error(`Firebase: Error (${code}).`);
