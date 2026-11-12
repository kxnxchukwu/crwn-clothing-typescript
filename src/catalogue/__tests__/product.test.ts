import { parseProduct } from "../product";
import { products } from "../../../scripts/data/products";
import { validateSeed } from "../../../scripts/lib/plan-sync";

const valid = {
  id: 1,
  name: "Brown Brim",
  category: "hats",
  price: 25,
  imageUrl: "https://example.test/brim.png",
  description: "A wide-brimmed hat.",
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
  ])("rejects %s", (_, data) => {
    expect(parseProduct(data)).toBeNull();
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

  it("gives every product its own description", () => {
    const descriptions = new Set(products.map((p) => p.description));
    expect(descriptions.size).toBe(products.length);
  });
});
