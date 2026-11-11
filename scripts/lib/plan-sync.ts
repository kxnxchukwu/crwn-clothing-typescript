import { parseProduct, type Product } from "../../src/catalogue/product";

const FIELDS = [
  "id",
  "name",
  "category",
  "price",
  "imageUrl",
  "description",
] as const satisfies readonly (keyof Product)[];

export interface SyncPlan {
  create: Product[];
  update: { product: Product; changed: string[] }[];
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
    const changed = FIELDS.filter((field) => current[field] !== product[field]);
    if (changed.length > 0) plan.update.push({ product, changed });
    else plan.unchanged.push(product.id);
  }

  for (const id of existing.keys()) {
    if (!seedIds.has(id)) plan.extra.push(id);
  }
  return plan;
}
