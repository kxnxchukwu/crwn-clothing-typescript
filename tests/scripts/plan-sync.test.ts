import { planProductSync, validateSeed } from "../../scripts/lib/plan-sync";
import type { Product } from "../../src/catalogue/product";

const hat: Product = {
  id: 1,
  name: "Brown Brim",
  category: "hats",
  price: 25,
  imageUrl: "brim.png",
  description: "A hat.",
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
      { product: hat, changed: ["price", "description"] },
    ]);
    expect(plan.unchanged).toEqual([2]);
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
