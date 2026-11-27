import {
  CATEGORIES,
  ONE_SIZE,
  SIZES_BY_CATEGORY,
  stockOf,
  type Product,
} from "../catalogue/product";

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A to Z" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

// Anything unknown in the URL falls back to the default order.
export const parseSort = (value: string | null): SortOption =>
  SORT_OPTIONS.find((option) => option.value === value)?.value ?? "featured";

const categoryTitle = (product: Product) =>
  CATEGORIES.find((category) => category.id === product.category)?.title ?? "";

// Lower-case, accent-free text so "cafe" finds "Café".
const normalise = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

// Every word in the query has to appear somewhere in the product's name,
// description or category, so "blue jacket" narrows rather than widens.
export function matchesQuery(product: Product, query: string): boolean {
  const words = normalise(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const text = normalise(
    `${product.name} ${product.description} ${categoryTitle(product)}`,
  );
  return words.every((word) => text.includes(word));
}

const compare: Record<SortOption, (a: Product, b: Product) => number> = {
  featured: (a, b) => a.id - b.id,
  "price-asc": (a, b) => a.price - b.price || a.id - b.id,
  "price-desc": (a, b) => b.price - a.price || a.id - b.id,
  name: (a, b) => a.name.localeCompare(b.name, "en"),
};

// Every size the shop uses, smallest first: clothing, then shoes. "One size"
// isn't something to filter by.
const SIZE_ORDER = [...new Set(Object.values(SIZES_BY_CATEGORY).flat())].filter(
  (size) => size !== ONE_SIZE,
);

// The sizes worth offering in the filter for these products.
export const sizeOptions = (products: Product[]): string[] =>
  SIZE_ORDER.filter((size) =>
    products.some((product) => product.sizes.includes(size)),
  );

// In stock in that size right now.
export const hasSizeInStock = (product: Product, size: string): boolean =>
  stockOf(product, size) > 0;

export interface ProductFilters {
  query?: string;
  category?: string;
  // Only products with this size in stock.
  size?: string;
  sort?: SortOption;
}

// The shop's listing: products in a category (or all), matching the search,
// in the chosen order. Pure, so the URL is the only state it needs.
export function filterProducts(
  products: Product[],
  { query = "", category, size, sort = "featured" }: ProductFilters,
): Product[] {
  return products
    .filter((product) => !category || product.category === category)
    .filter((product) => !size || hasSizeInStock(product, size))
    .filter((product) => matchesQuery(product, query))
    .sort(compare[sort]);
}
