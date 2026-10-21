import { initializeApp, getApps } from "firebase/app";
import { collection, getDocs, getFirestore } from "firebase/firestore/lite";
import { firebaseConfig } from "../../../src/firebase/config";

// Reads every product's price from the same public catalogue the shop shows.
// firestore/lite is REST-only, which suits a short-lived function.
export const loadPrices = async (): Promise<Map<number, number>> => {
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const snapshot = await getDocs(collection(getFirestore(app), "collections"));

  const prices = new Map<number, number>();
  for (const doc of snapshot.docs) {
    const items = (doc.data().items ?? []) as { id: unknown; price: unknown }[];
    for (const { id, price } of items) {
      if (Number.isInteger(id) && typeof price === "number" && price > 0) {
        prices.set(id as number, price);
      }
    }
  }
  return prices;
};
