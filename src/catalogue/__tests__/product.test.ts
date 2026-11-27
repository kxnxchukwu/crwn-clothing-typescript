import {
  isOneSize,
  isSoldOut,
  parseProduct,
  SIZES_BY_CATEGORY,
  stockOf,
} from "../product";
import { products } from "../../../scripts/data/products";
import { validateSeed } from "../../../scripts/lib/plan-sync";

const valid = {
  id: 1,
  name: "Brown Brim",
  category: "hats",
  price: 25,
  imageUrl: "https://example.test/brim.png",
  description: "A wide-brimmed hat.",
  sizes: ["One size"],
  stock: { "One size": 4 },
};
const jacket = {
  ...valid,
  id: 18,
  category: "jackets",
  sizes: ["S", "M", "L"],
  stock: { S: 2, M: 0, L: 5 },
};

describe("parseProduct", () => {
  it("accepts a complete product and drops unknown fields", () => {
    expect(parseProduct({ ...valid, legacy: true })).toEqual(valid);
  });

  it.each([
    ["not an object", null],
    ["a missing description", { ...valid, description: undefined }],
    ["a blank name", { ...valid, name: "  " }],
    ["an unknown category", { ...valid, category: "socks" }],
    ["a string price", { ...valid, price: "25" }],
    ["a zero price", { ...valid, price: 0 }],
    ["a non-integer id", { ...valid, id: 1.5 }],
    ["a string id", { ...valid, id: "1" }],
    ["no sizes", { ...valid, sizes: undefined }],
    ["an empty size list", { ...valid, sizes: [] }],
    ["a repeated size", { ...valid, sizes: ["M", "M"] }],
    ["a blank size", { ...valid, sizes: [""] }],
    ["no stock", { ...valid, stock: undefined }],
  ])("rejects %s", (_, data) => {
    expect(parseProduct(data)).toBeNull();
  });
  it("reads missing or invalid counts as sold out, never as unlimited", () => {
    expect(
      parseProduct({
        ...jacket,
        stock: { S: -1, M: 2.5, XL: 9 },
      })?.stock,
    ).toEqual({ S: 0, M: 0, L: 0 });
  });
});

describe("stock helpers", () => {
  const product = parseProduct(jacket)!;

  it("reads a size's stock", () => {
    expect(stockOf(product, "L")).toBe(5);
    expect(stockOf(product, "XXL")).toBe(0);
  });

  it("is sold out only when every size is", () => {
    expect(isSoldOut(product)).toBe(false);
    expect(isSoldOut({ ...product, stock: { S: 0, M: 0, L: 0 } })).toBe(true);
  });

  it("knows one-size products", () => {
    expect(isOneSize(parseProduct(valid)!)).toBe(true);
    expect(isOneSize(product)).toBe(false);
  });
});

describe("the seed catalogue", () => {
  it("is valid, with unique ids", () => {
    expect(validateSeed(products)).toEqual([]);
  });

  it("keeps the original 35 products and their ids", () => {
    expect(products.map((p) => p.id)).toEqual(
      Array.from({ length: 35 }, (_, i) => i + 1),
    );
  });

  it("gives every product its category's sizes and a count for each", () => {
    for (const product of products) {
      expect(product.sizes).toEqual(SIZES_BY_CATEGORY[product.category]);
      expect(Object.keys(product.stock)).toEqual(product.sizes);
    }
  });

  it("gives every product its own description", () => {
    const descriptions = new Set(products.map((p) => p.description));
    expect(descriptions.size).toBe(products.length);
  });
});
