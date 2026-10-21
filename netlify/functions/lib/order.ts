// Server-side order pricing. The browser only says *what* it wants to buy;
// prices always come from Firestore so a tampered request can't change them.

export interface OrderLine {
  id: number;
  quantity: number;
}

export const MAX_LINES = 50;
export const MAX_QUANTITY = 99;
// Stripe's minimum charge for EUR.
export const MIN_TOTAL_CENTS = 50;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const isPositiveInt = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) > 0;

// Validates `{ items: [{ id, quantity }] }` and merges duplicate ids.
export const parseOrderLines = (body: unknown): Result<OrderLine[]> => {
  const items = (body as { items?: unknown } | null)?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }
  if (items.length > MAX_LINES) {
    return { ok: false, error: "Too many items in one order." };
  }

  const quantities = new Map<number, number>();
  for (const item of items) {
    const { id, quantity } = (item ?? {}) as Record<string, unknown>;
    if (!isPositiveInt(id) || !isPositiveInt(quantity)) {
      return { ok: false, error: "Invalid item in cart." };
    }
    const merged = (quantities.get(id) ?? 0) + quantity;
    if (merged > MAX_QUANTITY) {
      return { ok: false, error: "Quantity too large for one order." };
    }
    quantities.set(id, merged);
  }

  return {
    ok: true,
    value: [...quantities].map(([id, quantity]) => ({ id, quantity })),
  };
};

// Total in cents, using catalogue prices (euros) keyed by product id.
export const computeTotalCents = (
  lines: OrderLine[],
  pricesById: Map<number, number>,
): Result<number> => {
  let total = 0;
  for (const { id, quantity } of lines) {
    const price = pricesById.get(id);
    if (price === undefined) {
      return {
        ok: false,
        error: "An item in your cart is no longer available.",
      };
    }
    total += Math.round(price * 100) * quantity;
  }
  if (total < MIN_TOTAL_CENTS) {
    return { ok: false, error: "Order total is below the minimum charge." };
  }
  return { ok: true, value: total };
};
