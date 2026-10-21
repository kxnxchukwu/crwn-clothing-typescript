import { initializeApp, getApps } from "firebase/app";
import { collection, getDocs, getFirestore } from "firebase/firestore/lite";
import { firebaseConfig } from "../../../src/firebase/config";

export interface CatalogueItem {
  name: string;
  price: number;
  imageUrl: string;
}

// Reads every product from the same public catalogue the shop shows.
// firestore/lite is REST-only, which suits a short-lived function.
export const loadCatalogue = async (): Promise<Map<number, CatalogueItem>> => {
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const snapshot = await getDocs(collection(getFirestore(app), "collections"));

  const catalogue = new Map<number, CatalogueItem>();
  for (const doc of snapshot.docs) {
    const items = (doc.data().items ?? []) as Record<string, unknown>[];
    for (const { id, name, price, imageUrl } of items) {
      if (Number.isInteger(id) && typeof price === "number" && price > 0) {
        catalogue.set(id as number, {
          name: String(name ?? ""),
          price,
          imageUrl: String(imageUrl ?? ""),
        });
      }
    }
  }
  return catalogue;
};
