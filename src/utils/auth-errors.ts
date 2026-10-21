// Firebase error messages look like "Firebase: Error (auth/invalid-credential)."
// Map the codes people actually hit to plain-English copy.
const messages: Record<string, string> = {
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/wrong-password": "Email or password is incorrect.",
  "auth/user-not-found": "Email or password is incorrect.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Use a password with at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Wait a moment, then try again.",
  "auth/network-request-failed":
    "Couldn't connect. Check your internet connection and try again.",
  "auth/popup-blocked":
    "Your browser blocked the Google sign-in window. Allow pop-ups and try again.",
};

// Closing the Google popup is a choice, not an error.
const ignored = ["auth/popup-closed-by-user", "auth/cancelled-popup-request"];

export const authErrorMessage = (raw: unknown): string | null => {
  const text = typeof raw === "string" ? raw : "";
  const code = text.match(/auth\/[a-z-]+/)?.[0];
  if (code && ignored.includes(code)) return null;
  return (code && messages[code]) ?? "Something went wrong. Please try again.";
};
