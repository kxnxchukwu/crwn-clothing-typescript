// Server-side order pricing. The browser only says *what* it wants to buy;
// prices always come from Firestore so a tampered request can't change them.

export interface OrderLine {
  id: number;
  size: string;
  quantity: number;
}

export const MAX_LINES = 50;
export const MAX_QUANTITY = 99;
// Stripe's minimum charge for EUR.
export const MIN_TOTAL_CENTS = 50;
const MAX_SIZE_LENGTH = 20;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const isPositiveInt = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) > 0;

// Validates `{ items: [{ id, size, quantity }] }` and merges lines for the
// same product and size.
export const parseOrderLines = (body: unknown): Result<OrderLine[]> => {
  const items = (body as { items?: unknown } | null)?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }
  if (items.length > MAX_LINES) {
    return { ok: false, error: "Too many items in one order." };
  }

  const lines = new Map<string, OrderLine>();
  for (const item of items) {
    const { id, size, quantity } = (item ?? {}) as Record<string, unknown>;
    if (
      !isPositiveInt(id) ||
      !isPositiveInt(quantity) ||
      typeof size !== "string" ||
      size.trim() === "" ||
      size.length > MAX_SIZE_LENGTH
    ) {
      return { ok: false, error: "Invalid item in cart." };
    }
    const key = `${id}|${size}`;
    const merged = (lines.get(key)?.quantity ?? 0) + quantity;
    if (merged > MAX_QUANTITY) {
      return { ok: false, error: "Quantity too large for one order." };
    }
    lines.set(key, { id, size, quantity: merged });
  }

  return { ok: true, value: [...lines.values()] };
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

// Checks every line against the catalogue's sizes and stock, so a payment
// is never started for something that can't be sent. Stock is checked again
// (and taken) when the payment succeeds; see the Stripe webhook.
export const checkStock = (
  lines: OrderLine[],
  catalogue: Map<number, StockedItem>,
): Result<null> => {
  for (const { id, size, quantity } of lines) {
    const product = catalogue.get(id);
    if (!product) {
      return {
        ok: false,
        error: "An item in your cart is no longer available.",
      };
    }
    if (!product.sizes.includes(size)) {
      return { ok: false, error: "Invalid item in cart." };
    }
    const available = product.stock[size] ?? 0;
    if (quantity > available) {
      const what =
        product.sizes.length > 1 ? `${product.name} in ${size}` : product.name;
      return {
        ok: false,
        error:
          available === 0
            ? `${what} is sold out.`
            : `Only ${available} left of ${what}.`,
      };
    }
  }
  return { ok: true, value: null };
};

export interface StockedItem {
  name: string;
  sizes: string[];
  stock: Record<string, number>;
}

export interface OrderItem {
  id: number;
  size: string;
  name: string;
  imageUrl: string;
  price: number; // euros, as charged
  quantity: number;
}

// Snapshot of what was bought, so later catalogue changes don't alter
// past orders. Assumes lines were already priced with computeTotalCents.
export const toOrderItems = (
  lines: OrderLine[],
  catalogue: Map<number, { name: string; price: number; imageUrl: string }>,
): OrderItem[] =>
  lines.map(({ id, size, quantity }) => {
    const { name, price, imageUrl } = catalogue.get(id)!;
    return { id, size, name, imageUrl, price, quantity };
  });

// Takes paid lines out of stock. Returns the new counts per product, and any
// units that weren't there to take: two shoppers can pay for the last item
// at the same moment, and both payments go through. Counts never go below 0.
export const takeStock = (
  lines: Pick<OrderLine, "id" | "size" | "quantity">[],
  stockById: Map<number, Record<string, number>>,
): {
  stock: Map<number, Record<string, number>>;
  shortfall: { id: number; size: string; missing: number }[];
} => {
  const stock = new Map<number, Record<string, number>>(
    [...stockById].map(([id, counts]) => [id, { ...counts }]),
  );
  const shortfall: { id: number; size: string; missing: number }[] = [];
  for (const { id, size, quantity } of lines) {
    const counts = stock.get(id);
    if (!counts) continue; // product removed since; nothing to take
    const available = counts[size] ?? 0;
    const taken = Math.min(available, quantity);
    counts[size] = available - taken;
    if (taken < quantity)
      shortfall.push({ id, size, missing: quantity - taken });
  }
  return { stock, shortfall };
};
