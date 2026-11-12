// Syncs Firestore `products/{id}` with scripts/data/products.ts.
//
//   npm run seed:products -- --dry-run   # show what would change, write nothing
//   npm run seed:products                # apply it
//
// Safe to run again: unchanged products are skipped and nothing is deleted.
// Needs FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY (read from .env.local).
import { existsSync } from "node:fs";
import { products } from "./data/products";
import { planProductSync, validateSeed } from "./lib/plan-sync";
import { getAdmin } from "../netlify/functions/lib/admin";
import { firebaseConfig } from "../src/firebase/config";

const dryRun = process.argv.includes("--dry-run");

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const problems = validateSeed(products);
if (problems.length > 0) {
  console.error(`The seed has problems:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}

const admin = getAdmin();
if (!admin) {
  console.error(
    "Firebase Admin isn't configured. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local.",
  );
  process.exit(1);
}

const productsRef = admin.db.collection("products");
const snapshot = await productsRef.get();
const existing = new Map(snapshot.docs.map((doc) => [doc.id, doc.data()]));
const plan = planProductSync(products, existing);

console.log(`Project: ${firebaseConfig.projectId}`);
console.log(`Seed: ${products.length} products\n`);
for (const product of plan.create) {
  console.log(`  + create ${product.id} ${product.name}`);
}
for (const { product, changed } of plan.update) {
  console.log(
    `  ~ update ${product.id} ${product.name} (${changed.join(", ")})`,
  );
}
for (const id of plan.extra) {
  console.log(`  ? products/${id} isn't in the seed (left alone)`);
}
console.log(
  `\n${plan.create.length} to create, ${plan.update.length} to update, ${plan.unchanged.length} unchanged.`,
);

const writes = [...plan.create, ...plan.update.map(({ product }) => product)];
if (dryRun) {
  console.log("Dry run: nothing was written.");
} else if (writes.length === 0) {
  console.log("Firestore already matches the seed.");
} else {
  // One batch (max 500 writes) so a failure leaves nothing half-applied.
  const batch = admin.db.batch();
  for (const product of writes) {
    batch.set(productsRef.doc(String(product.id)), product);
  }
  await batch.commit();
  console.log(`Wrote ${writes.length} products.`);
}
