import type { Handler } from "@netlify/functions";
import Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";
import { computeTotalCents, parseOrderLines, toOrderItems } from "./lib/order";
import { loadCatalogue } from "./lib/catalogue";
import { getAdmin } from "./lib/admin";

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// Creates a PaymentIntent for the cart. The client sends item ids and
// quantities only; the amount is computed here from Firestore prices.
// When Firebase Admin is configured, it also records a pending order
// (orders/{paymentIntentId}) that the Stripe webhook later marks as paid.
const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("STRIPE_SECRET_KEY is not set");
    return json(500, { error: "Payments are not configured." });
  }

  let body: unknown;
  try {
    body = JSON.parse(event.body ?? "");
  } catch {
    return json(400, { error: "Invalid request." });
  }

  const lines = parseOrderLines(body);
  if (!lines.ok) return json(400, { error: lines.error });

  const admin = getAdmin();

  // Signed-in shoppers send their Firebase ID token so the order is theirs.
  let user: { uid: string; email: string | null } | null = null;
  const token = event.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (admin && token) {
    try {
      const decoded = await admin.auth.verifyIdToken(token);
      user = { uid: decoded.uid, email: decoded.email ?? null };
    } catch {
      return json(401, { error: "Your session has expired. Sign in again." });
    }
  }

  try {
    const catalogue = await loadCatalogue();
    const prices = new Map(
      [...catalogue].map(([id, { price }]) => [id, price] as const),
    );
    const total = computeTotalCents(lines.value, prices);
    if (!total.ok) return json(400, { error: total.error });

    const stripe = new Stripe(secretKey, { apiVersion: "2022-11-15" });
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total.value,
      currency: "eur",
      payment_method_types: ["card"],
      metadata: {
        items: lines.value
          .map(({ id, quantity }) => `${id}x${quantity}`)
          .join(","),
        userId: user?.uid ?? "",
      },
    });

    if (admin) {
      await admin.db
        .collection("orders")
        .doc(paymentIntent.id)
        .set({
          status: "pending",
          userId: user?.uid ?? null,
          email: user?.email ?? null,
          items: toOrderItems(lines.value, catalogue),
          total: total.value,
          currency: "eur",
          paymentIntentId: paymentIntent.id,
          createdAt: FieldValue.serverTimestamp(),
        });
    }

    return json(200, {
      clientSecret: paymentIntent.client_secret,
      amount: total.value,
    });
  } catch (error) {
    // Log the detail server-side; don't leak it to the browser.
    console.error("create-payment-intent failed", error);
    return json(502, { error: "We couldn't start your payment." });
  }
};

export { handler };
