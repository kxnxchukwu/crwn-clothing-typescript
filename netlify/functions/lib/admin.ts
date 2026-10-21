import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { firebaseConfig } from "../../../src/firebase/config";

// Firebase Admin, configured from a service account's email and private key.
// Returns null when those env vars are missing, so payments still work
// without order saving.
const adminApp = (): App | null => {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!clientEmail || !privateKey) return null;
  try {
    return (
      getApps()[0] ??
      initializeApp({
        credential: cert({
          projectId: firebaseConfig.projectId,
          clientEmail,
          // Netlify stores the key on one line with literal "\n" sequences.
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      })
    );
  } catch (error) {
    // A badly pasted key shouldn't take payments down with it.
    console.error("Firebase Admin credentials are invalid", error);
    return null;
  }
};

export const getAdmin = () => {
  const app = adminApp();
  return app ? { auth: getAuth(app), db: getFirestore(app) } : null;
};
