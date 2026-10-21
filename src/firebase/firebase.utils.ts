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
  writeBatch,
  QuerySnapshot,
  DocumentData,
  Timestamp,
} from "firebase/firestore";
import type { Item } from "../features/cart-slice";
import { firebaseConfig } from "./config";

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export interface Collection {
  id: string;
  items: Item[];
  routeName: string;
  title: string;
}

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

export const addCollectionAndDocuments = async (
  collectionKey: string,
  documentsToAdd: DocumentData[],
) => {
  const collectionRef = collection(firestore, collectionKey);
  const batch = writeBatch(firestore);

  documentsToAdd.forEach((document) => {
    batch.set(doc(collectionRef), document);
  });

  return await batch.commit();
};

export const convertCollectionsSnapshotToMap = (
  collections: QuerySnapshot<DocumentData>,
) => {
  const transformedCollection: Collection[] = collections.docs.map((doc) => {
    const { title, items } = doc.data();

    return {
      routeName: encodeURI(title.toLowerCase()),
      id: doc.id,
      title,
      items,
    };
  });

  return transformedCollection.reduce<Record<string, Collection>>(
    (accumulator, collection) => {
      accumulator[collection.title.toLowerCase()] = collection;
      return accumulator;
    },
    {},
  );
};

export const getCollections = async () =>
  convertCollectionsSnapshotToMap(
    await getDocs(collection(firestore, "collections")),
  );

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
