import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { parseProduct, type Product } from "../catalogue/product";
import { firebaseConfig } from "./config";

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  // ISO string so the profile stays serializable in Redux.
  createdAt: string | null;
}

// Creates users/{uid} on first sign-in, then returns the stored profile.
export const createUserProfileDocument = async (
  userAuth: User,
  additionalInfo: Record<string, unknown> = {},
): Promise<UserProfile> => {
  const userRef = doc(firestore, "users", userAuth.uid);
  let snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { displayName, email } = userAuth;
    await setDoc(userRef, {
      displayName,
      email,
      createdAt: new Date(),
      ...additionalInfo,
    });
    snapshot = await getDoc(userRef);
  }

  const { displayName, email, createdAt } = snapshot.data() ?? {};
  return {
    id: snapshot.id,
    displayName,
    email,
    createdAt:
      createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : null,
  };
};

// Every valid product, in id order. Invalid documents are skipped (and
// logged) so one bad edit can't take the whole shop down.
export const getProducts = async (): Promise<Product[]> => {
  const snapshot = await getDocs(collection(firestore, "products"));
  const products: Product[] = [];
  for (const document of snapshot.docs) {
    const product = parseProduct(document.data());
    if (product) products.push(product);
    else console.warn(`Skipping invalid product ${document.id}`);
  }
  return products.sort((a, b) => a.id - b.id);
};

export const getCurrentUser = () =>
  new Promise<User | null>((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (userAuth) => {
        unsubscribe();
        resolve(userAuth);
      },
      reject,
    );
  });
