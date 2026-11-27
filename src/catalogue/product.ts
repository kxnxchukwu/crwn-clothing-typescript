// The product model, shared by the shop, the payment functions and the seed
// script so all three agree on what a valid product is.

export const CATEGORIES = [
  { id: "hats", title: "Hats" },
  { id: "jackets", title: "Jackets" },
  { id: "sneakers", title: "Sneakers" },
  { id: "womens", title: "Womens" },
  { id: "mens", title: "Mens" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const ONE_SIZE = "One size";

// The sizes each category comes in, smallest first. Sneakers use EU sizes.
export const SIZES_BY_CATEGORY: Record<CategoryId, readonly string[]> = {
  hats: [ONE_SIZE],
  jackets: ["XS", "S", "M", "L", "XL"],
  sneakers: ["EU 40", "EU 41", "EU 42", "EU 43", "EU 44", "EU 45"],
  womens: ["XS", "S", "M", "L", "XL"],
  mens: ["XS", "S", "M", "L", "XL"],
};

// At or below this, the shop says "Only N left".
export const LOW_STOCK = 3;

// One Firestore document per product in `products/{id}`.
export interface Product {
  id: number;
  name: string;
  category: CategoryId;
  // Euros, VAT included. The payment function charges this, never the
  // browser's copy.
  price: number;
  imageUrl: string;
  description: string;
  // Sizes in display order; "One size" alone for hats.
  sizes: string[];
  // Units in stock per size. Written by the seed for new sizes, then only
  // by the Stripe webhook as orders are paid.
  stock: Record<string, number>;
}

export const stockOf = (product: Product, size: string): number =>
  product.stock[size] ?? 0;

export const isSoldOut = (product: Product): boolean =>
  product.sizes.every((size) => stockOf(product, size) <= 0);

export const isOneSize = (product: Product): boolean =>
  product.sizes.length === 1;

export const isCategoryId = (value: unknown): value is CategoryId =>
  CATEGORIES.some((category) => category.id === value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

// Turns raw document data into a Product, or null if anything is missing or
// the wrong type. Bad documents are skipped rather than crashing the shop.
export function parseProduct(data: unknown): Product | null {
  if (typeof data !== "object" || data === null) return null;
  const { id, name, category, price, imageUrl, description, sizes, stock } =
    data as Record<string, unknown>;
  if (
    !Number.isInteger(id) ||
    (id as number) <= 0 ||
    !isText(name) ||
    !isCategoryId(category) ||
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !isText(imageUrl) ||
    !isText(description) ||
    !isSizeList(sizes) ||
    typeof stock !== "object" ||
    stock === null
  ) {
    return null;
  }
  // Every listed size gets a count; anything missing or invalid reads as 0
  // (sold out) rather than as unlimited.
  const counts = stock as Record<string, unknown>;
  const cleanStock = Object.fromEntries(
    sizes.map((size) => {
      const count = counts[size];
      return [
        size,
        Number.isInteger(count) && (count as number) > 0
          ? (count as number)
          : 0,
      ];
    }),
  );
  return {
    id: id as number,
    name,
    category,
    price,
    imageUrl,
    description,
    sizes: [...sizes],
    stock: cleanStock,
  };
}

const isSizeList = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every(isText) &&
  new Set(value).size === value.length;
