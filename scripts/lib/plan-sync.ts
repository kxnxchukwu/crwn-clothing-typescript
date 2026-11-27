import { parseProduct, type Product } from "../../src/catalogue/product";

// Fields the seed owns. Stock isn't one of them: see `newStock` below.
const FIELDS = [
  "id",
  "name",
  "category",
  "price",
  "imageUrl",
  "description",
  "sizes",
] as const satisfies readonly (keyof Product)[];

// What one product's write looks like: the catalogue fields, plus starting
// counts only for sizes Firestore doesn't count yet. Written with
// `{ merge: true }`, so existing counts are never touched.
export type ProductWrite = Omit<Product, "stock"> & {
  stock: Record<string, number>;
};

export interface SyncPlan {
  create: ProductWrite[];
  update: { product: ProductWrite; changed: string[] }[];
  unchanged: number[];
  // Documents in Firestore that the seed doesn't mention. Never deleted
  // automatically: removing a product is a deliberate, separate step.
  extra: string[];
}

// Checks the seed before anything is written: every product valid, every
// id unique.
export function validateSeed(seed: Product[]): string[] {
  const problems: string[] = [];
  const seen = new Set<number>();
  for (const product of seed) {
    if (!parseProduct(product)) {
      problems.push(`Product ${product.id} (${product.name}) is invalid`);
    }
    if (seen.has(product.id)) {
      problems.push(`Product id ${product.id} is used more than once`);
    }
    seen.add(product.id);
  }
  return problems;
}

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

// Starting counts for the sizes that have none in Firestore yet.
const newStock = (
  product: Product,
  current: Record<string, unknown> | undefined,
): Record<string, number> => {
  const counted = (current?.stock ?? {}) as Record<string, unknown>;
  return Object.fromEntries(
    product.sizes
      .filter((size) => !Number.isInteger(counted[size]))
      .map((size) => [size, product.stock[size] ?? 0]),
  );
};

// Works out what has to change so Firestore matches the seed. Pure, so the
// script can print it for a dry run and tests can check it without Firebase.
export function planProductSync(
  seed: Product[],
  existing: Map<string, Record<string, unknown>>,
): SyncPlan {
  const plan: SyncPlan = { create: [], update: [], unchanged: [], extra: [] };
  const seedIds = new Set(seed.map((product) => String(product.id)));

  for (const product of seed) {
    const current = existing.get(String(product.id));
    if (!current) {
      plan.create.push(product);
      continue;
    }
    const stock = newStock(product, current);
    const changed: string[] = FIELDS.filter(
      (field) => !same(current[field], product[field]),
    );
    const added = Object.keys(stock);
    if (added.length > 0) changed.push(`stock for ${added.join(", ")}`);

    if (changed.length > 0) {
      plan.update.push({ product: { ...product, stock }, changed });
    } else {
      plan.unchanged.push(product.id);
    }
  }

  for (const id of existing.keys()) {
    if (!seedIds.has(id)) plan.extra.push(id);
  }
  return plan;
}
