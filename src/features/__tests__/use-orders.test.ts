import { act, renderHook } from "@testing-library/react";
import { useOrders } from "../use-orders";
import { firebaseUtilsMock } from "../../test/firebase-mock";

type Listener = {
  next: (snapshot: unknown) => void;
  error: (error: { code: string }) => void;
};

const firestore = vi.hoisted(() => {
  class FakeTimestamp {
    constructor(private iso: string) {}
    toDate() {
      return new Date(this.iso);
    }
  }
  return {
    Timestamp: FakeTimestamp,
    listeners: [] as Listener[],
    unsubscribe: vi.fn(),
    where: vi.fn((...args: unknown[]) => args),
  };
});

vi.mock(
  "../../firebase/firebase.utils",
  async () => (await import("../../test/firebase-mock")).firebaseUtilsMock,
);
vi.mock("firebase/firestore", () => ({
  Timestamp: firestore.Timestamp,
  collection: vi.fn(() => "orders-collection"),
  where: firestore.where,
  query: vi.fn((...args: unknown[]) => args),
  onSnapshot: vi.fn(
    (_query: unknown, next: Listener["next"], error: Listener["error"]) => {
      firestore.listeners.push({ next, error });
      return firestore.unsubscribe;
    },
  ),
}));

const latest = () => firestore.listeners[firestore.listeners.length - 1];
const doc = (id: string, createdAt: string | null) => ({
  id,
  data: () => ({
    items: [],
    total: 1000,
    createdAt: createdAt ? new firestore.Timestamp(createdAt) : null,
  }),
});

describe("useOrders", () => {
  beforeEach(() => {
    firestore.listeners.length = 0;
    vi.clearAllMocks();
    firebaseUtilsMock.auth.currentUser = { getIdToken: async () => "t" };
  });

  it("listens for the user's paid orders and sorts newest first", () => {
    const { result } = renderHook(() => useOrders("user-1"));
    expect(result.current).toEqual({ status: "loading" });
    expect(firestore.where).toHaveBeenCalledWith("userId", "==", "user-1");
    expect(firestore.where).toHaveBeenCalledWith("status", "==", "paid");

    act(() =>
      latest().next({
        docs: [
          doc("older", "2026-10-20T10:00:00Z"),
          doc("newer", "2026-10-21T10:00:00Z"),
          doc("no-date", null),
        ],
      }),
    );

    expect(result.current.status).toBe("ready");
    const orders =
      result.current.status === "ready" ? result.current.orders : [];
    expect(orders.map((o) => o.id)).toEqual(["newer", "older", "no-date"]);
    expect(orders[0].createdAt).toEqual(new Date("2026-10-21T10:00:00Z"));
  });

  it("does nothing without a user", () => {
    const { result } = renderHook(() => useOrders(undefined));
    expect(firestore.listeners).toHaveLength(0);
    expect(result.current).toEqual({ status: "loading" });
  });

  it("reports real errors", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useOrders("user-1"));
    act(() => latest().error({ code: "unavailable" }));
    expect(result.current).toEqual({ status: "error" });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("ignores permission-denied caused by signing out", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useOrders("user-1"));
    firebaseUtilsMock.auth.currentUser = null;
    act(() => latest().error({ code: "permission-denied" }));
    expect(result.current).toEqual({ status: "loading" });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("treats a different user's results as still loading and unsubscribes", () => {
    const { result, rerender } = renderHook(({ id }) => useOrders(id), {
      initialProps: { id: "user-1" },
    });
    act(() => latest().next({ docs: [doc("a", "2026-10-21T10:00:00Z")] }));
    expect(result.current.status).toBe("ready");

    rerender({ id: "user-2" });
    expect(firestore.unsubscribe).toHaveBeenCalled();
    expect(result.current).toEqual({ status: "loading" });
  });
});
