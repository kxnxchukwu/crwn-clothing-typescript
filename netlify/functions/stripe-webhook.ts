import type { Handler } from "@netlify/functions";
import Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";
import { getAdmin } from "./lib/admin";

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// Stripe calls this after a payment settles. It's the only place an order
// becomes "paid": the browser's word for it isn't trusted.
const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const admin = getAdmin();
  if (!secretKey || !webhookSecret || !admin) {
    // Non-2xx so Stripe retries once the environment is configured.
    console.error("stripe-webhook is not configured");
    return json(500, { error: "Webhook not configured." });
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2022-11-15" });
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body ?? "", "base64").toString("utf8")
    : (event.body ?? "");

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      event.headers["stripe-signature"] ?? "",
      webhookSecret,
    );
  } catch {
    return json(400, { error: "Invalid signature." });
  }

  const status =
    stripeEvent.type === "payment_intent.succeeded"
      ? "paid"
      : stripeEvent.type === "payment_intent.payment_failed"
        ? "failed"
        : null;
  if (!status) return json(200, { received: true, ignored: stripeEvent.type });

  const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent;
  const orderRef = admin.db.collection("orders").doc(paymentIntent.id);

  try {
    await admin.db.runTransaction(async (transaction) => {
      const order = await transaction.get(orderRef);
      if (!order.exists) {
        // Created before order saving was configured; nothing to update.
        console.warn(`No order for ${paymentIntent.id}`);
        return;
      }
      // Stripe can deliver events more than once; never downgrade "paid".
      if (order.get("status") === "paid") return;
      transaction.update(
        orderRef,
        status === "paid"
          ? {
              status,
              amountReceived: paymentIntent.amount_received,
              paidAt: FieldValue.serverTimestamp(),
            }
          : { status },
      );
    });
  } catch (error) {
    console.error("stripe-webhook failed to update order", error);
    return json(500, { error: "Could not update order." });
  }

  return json(200, { received: true });
};

export { handler };
