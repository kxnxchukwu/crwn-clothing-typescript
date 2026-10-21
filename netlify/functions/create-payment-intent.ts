import type { Handler } from "@netlify/functions";
import Stripe from "stripe";
import { computeTotalCents, parseOrderLines } from "./lib/order";
import { loadPrices } from "./lib/prices";

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// Creates a PaymentIntent for the cart. The client sends item ids and
// quantities only; the amount is computed here from Firestore prices.
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

  try {
    const total = computeTotalCents(lines.value, await loadPrices());
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
      },
    });

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
