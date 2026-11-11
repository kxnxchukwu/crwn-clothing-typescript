import { initializeApp, getApps } from "firebase/app";
import { collection, getDocs, getFirestore } from "firebase/firestore/lite";
import { firebaseConfig } from "../../../src/firebase/config";
import { parseProduct } from "../../../src/catalogue/product";

export interface CatalogueItem {
  name: string;
  price: number;
  imageUrl: string;
}

// Reads every product from the same public catalogue the shop shows.
// firestore/lite is REST-only, which suits a short-lived function. Invalid
// documents are left out, so they can't be bought.
export const loadCatalogue = async (): Promise<Map<number, CatalogueItem>> => {
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const snapshot = await getDocs(collection(getFirestore(app), "products"));

  const catalogue = new Map<number, CatalogueItem>();
  for (const doc of snapshot.docs) {
    const product = parseProduct(doc.data());
    if (product) {
      const { id, name, price, imageUrl } = product;
      catalogue.set(id, { name, price, imageUrl });
    }
  }
  return catalogue;
};
