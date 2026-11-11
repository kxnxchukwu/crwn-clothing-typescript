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
}

export const isCategoryId = (value: unknown): value is CategoryId =>
  CATEGORIES.some((category) => category.id === value);

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

// Turns raw document data into a Product, or null if anything is missing or
// the wrong type. Bad documents are skipped rather than crashing the shop.
export function parseProduct(data: unknown): Product | null {
  if (typeof data !== "object" || data === null) return null;
  const { id, name, category, price, imageUrl, description } = data as Record<
    string,
    unknown
  >;
  if (
    !Number.isInteger(id) ||
    (id as number) <= 0 ||
    !isText(name) ||
    !isCategoryId(category) ||
    typeof price !== "number" ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !isText(imageUrl) ||
    !isText(description)
  ) {
    return null;
  }
  return { id: id as number, name, category, price, imageUrl, description };
}
