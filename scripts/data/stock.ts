import type { Product } from "../../src/catalogue/product";

// Starting stock for products and sizes Firestore doesn't count yet. The
// seed never overwrites an existing count: once a size is live, only paid
// orders (the Stripe webhook) change it.
//
// Most counts come from a fixed formula so they look varied but never
// change between runs. The overrides make sure the demo shop shows every
// state: sold out, a few left, and plenty.
const OVERRIDES: Record<number, Record<string, number>> = {
  1: { "One size": 12 }, // Brown Brim: the browser tests add it to carts
  2: { "One size": 0 }, // Blue Beanie: sold out
  4: { "One size": 7 },
  6: { "One size": 2 }, // Palm Tree Cap: only 2 left
  11: {
    "EU 40": 0,
    "EU 41": 1,
    "EU 42": 0,
    "EU 43": 2,
    "EU 44": 0,
    "EU 45": 0,
  },
  18: { XS: 0, S: 2, M: 5, L: 1, XL: 0 }, // Black Jean Shearling
  22: { XS: 0, S: 0, M: 0, L: 0, XL: 0 }, // Tan Trench: sold out
  25: { XS: 3, S: 0, M: 6, L: 4, XL: 1 }, // Floral Dress
};

// 0 to 12, from the product id and size; roughly one size in ten is 0.
const formula = (id: number, size: string) => {
  let hash = id * 31;
  for (const char of size) hash = (hash * 33 + char.charCodeAt(0)) % 9973;
  return hash % 10 === 0 ? 0 : (hash % 12) + 1;
};

export const initialStock = (
  product: Pick<Product, "id" | "sizes">,
): Record<string, number> =>
  Object.fromEntries(
    product.sizes.map((size) => [
      size,
      OVERRIDES[product.id]?.[size] ?? formula(product.id, size),
    ]),
  );
