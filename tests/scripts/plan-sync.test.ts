import { planProductSync, validateSeed } from "../../scripts/lib/plan-sync";
import type { Product } from "../../src/catalogue/product";

const hat: Product = {
  id: 1,
  name: "Brown Brim",
  category: "hats",
  price: 25,
  imageUrl: "brim.png",
  description: "A hat.",
  sizes: ["One size"],
  stock: { "One size": 5 },
};
const beanie: Product = { ...hat, id: 2, name: "Blue Beanie", price: 18 };

const firestore = (...docs: object[]) =>
  new Map(docs.map((doc) => [String((doc as Product).id), { ...doc }]));

describe("planProductSync", () => {
  it("creates everything on the first run", () => {
    const plan = planProductSync([hat, beanie], firestore());
    expect(plan.create).toEqual([hat, beanie]);
    expect(plan.update).toEqual([]);
  });

  it("does nothing when Firestore already matches", () => {
    const plan = planProductSync([hat, beanie], firestore(hat, beanie));
    expect(plan).toEqual({
      create: [],
      update: [],
      unchanged: [1, 2],
      extra: [],
    });
  });

  it("updates only changed products and names the changed fields", () => {
    const plan = planProductSync(
      [hat, beanie],
      firestore({ ...hat, price: 20, description: "Old" }, beanie),
    );
    expect(plan.update).toEqual([
      // Existing counts are left out of the write, so they stay as they are.
      { product: { ...hat, stock: {} }, changed: ["price", "description"] },
    ]);
    expect(plan.unchanged).toEqual([2]);
  });

  it("never resets stock that sales have changed", () => {
    const plan = planProductSync(
      [hat],
      firestore({ ...hat, stock: { "One size": 1 } }),
    );
    expect(plan.unchanged).toEqual([1]);
  });

  it("adds starting stock only for sizes Firestore doesn't count yet", () => {
    const jacket: Product = {
      ...hat,
      id: 18,
      category: "jackets",
      sizes: ["S", "M", "L"],
      stock: { S: 4, M: 4, L: 4 },
    };
    // A product from before sizes existed, then one with a new size added.
    const plan = planProductSync(
      [jacket, { ...beanie, sizes: ["One size"] }],
      firestore(
        { ...jacket, sizes: ["S", "M"], stock: { S: 0, M: 2 } },
        { ...beanie, sizes: undefined, stock: undefined },
      ),
    );
    expect(plan.update).toEqual([
      {
        product: { ...jacket, stock: { L: 4 } },
        changed: ["sizes", "stock for L"],
      },
      {
        product: { ...beanie, stock: { "One size": 5 } },
        changed: ["sizes", "stock for One size"],
      },
    ]);
  });

  it("reports products missing from the seed without deleting them", () => {
    const plan = planProductSync([hat], firestore(hat, beanie));
    expect(plan.extra).toEqual(["2"]);
  });
});

describe("validateSeed", () => {
  it("catches invalid products and duplicate ids", () => {
    expect(
      validateSeed([hat, { ...hat, name: "Copy" }, { ...beanie, price: -1 }]),
    ).toEqual([
      "Product id 1 is used more than once",
      "Product 2 (Blue Beanie) is invalid",
    ]);
  });
});
