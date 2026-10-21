import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { auth, firestore } from "../firebase/firebase.utils";

export interface Order {
  id: string;
  items: {
    id: number;
    name: string;
    imageUrl: string;
    price: number;
    quantity: number;
  }[];
  total: number; // cents
  createdAt: Date | null;
}

type OrdersState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; orders: Order[] };

// Live list of a user's paid orders, newest first. Orders are written only
// by the payment functions; Firestore rules limit reads to the owner.
export function useOrders(userId: string | undefined): OrdersState {
  // Results are tagged with the user they belong to, so a different user
  // reads as "loading" until their own snapshot arrives.
  const [result, setResult] = useState<{
    userId?: string;
    state: OrdersState;
  }>({ state: { status: "loading" } });

  useEffect(() => {
    if (!userId) return;
    // Two equality filters need no composite index; sort on the client.
    const ordersQuery = query(
      collection(firestore, "orders"),
      where("userId", "==", userId),
      where("status", "==", "paid"),
    );
    return onSnapshot(
      ordersQuery,
      (snapshot) => {
        const orders = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              items: data.items ?? [],
              total: data.total ?? 0,
              createdAt:
                data.createdAt instanceof Timestamp
                  ? data.createdAt.toDate()
                  : null,
            };
          })
          .sort(
            (a, b) =>
              (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
          );
        setResult({ userId, state: { status: "ready", orders } });
      },
      (error) => {
        // Signing out cancels this listener with permission-denied a moment
        // before the page redirects; that's expected, not a failure.
        if (error.code === "permission-denied" && !auth.currentUser) return;
        console.error("Couldn't load orders", error);
        setResult({ userId, state: { status: "error" } });
      },
    );
  }, [userId]);

  return result.userId === userId ? result.state : { status: "loading" };
}
