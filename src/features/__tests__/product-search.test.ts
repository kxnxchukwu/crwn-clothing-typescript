import {
  filterProducts,
  matchesQuery,
  parseSort,
  sizeOptions,
} from "../product-search";
import type { Product } from "../../catalogue/product";

const product = (overrides: Partial<Product>): Product => ({
  id: 1,
  name: "Brown Brim",
  category: "hats",
  price: 25,
  imageUrl: "x.png",
  description: "A wide-brimmed hat.",
  sizes: ["One size"],
  stock: { "One size": 3 },
  ...overrides,
});

const brim = product({});
const beanie = product({
  id: 2,
  name: "Blue Beanie",
  price: 18,
  description: "A snug knit beanie.",
});
const jacket = product({
  id: 18,
  name: "Blue Jean Jacket",
  category: "jackets",
  price: 90,
  description: "Classic denim.",
  sizes: ["S", "M", "L"],
  stock: { S: 1, M: 0, L: 4 },
});
const all = [jacket, brim, beanie];

const ids = (products: Product[]) => products.map((p) => p.id);

describe("matchesQuery", () => {
  it("matches name, description and category, ignoring case", () => {
    expect(matchesQuery(brim, "BRIM")).toBe(true);
    expect(matchesQuery(brim, "wide")).toBe(true);
    expect(matchesQuery(brim, "hats")).toBe(true);
    expect(matchesQuery(brim, "denim")).toBe(false);
  });

  it("needs every word to match", () => {
    expect(matchesQuery(jacket, "blue denim")).toBe(true);
    expect(matchesQuery(beanie, "blue denim")).toBe(false);
  });

  it("ignores accents and extra spaces, and matches everything when empty", () => {
    expect(matchesQuery(product({ name: "Café Cap" }), "  cafe  ")).toBe(true);
    expect(matchesQuery(brim, "   ")).toBe(true);
  });
});

describe("filterProducts", () => {
  it("keeps featured (catalogue) order by default", () => {
    expect(ids(filterProducts(all, {}))).toEqual([1, 2, 18]);
  });

  it("filters by category and query together", () => {
    expect(ids(filterProducts(all, { category: "hats" }))).toEqual([1, 2]);
    expect(ids(filterProducts(all, { query: "blue" }))).toEqual([2, 18]);
    expect(
      ids(filterProducts(all, { query: "blue", category: "hats" })),
    ).toEqual([2]);
  });

  it("sorts by price both ways and by name", () => {
    expect(ids(filterProducts(all, { sort: "price-asc" }))).toEqual([2, 1, 18]);
    expect(ids(filterProducts(all, { sort: "price-desc" }))).toEqual([
      18, 1, 2,
    ]);
    expect(ids(filterProducts(all, { sort: "name" }))).toEqual([2, 18, 1]);
  });

  it("doesn't reorder the list it was given", () => {
    filterProducts(all, { sort: "price-asc" });
    expect(ids(all)).toEqual([18, 1, 2]);
  });
});

describe("parseSort", () => {
  it("accepts known options and falls back to featured", () => {
    expect(parseSort("price-desc")).toBe("price-desc");
    expect(parseSort("cheapest")).toBe("featured");
    expect(parseSort(null)).toBe("featured");
  });
});

describe("sizes", () => {
  it("offers the sizes these products come in, smallest first", () => {
    const shoes = product({ id: 10, sizes: ["EU 42", "EU 40"], stock: {} });
    expect(sizeOptions([shoes, jacket, brim])).toEqual([
      "S",
      "M",
      "L",
      "EU 40",
      "EU 42",
    ]);
    expect(sizeOptions([brim])).toEqual([]);
  });

  it("keeps products with that size in stock", () => {
    expect(ids(filterProducts(all, { size: "L" }))).toEqual([18]);
    expect(ids(filterProducts(all, { size: "M" }))).toEqual([]);
    expect(ids(filterProducts(all, { size: "XL" }))).toEqual([]);
  });
});
