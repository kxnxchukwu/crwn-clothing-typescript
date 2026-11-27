import type { Handler } from "@netlify/functions";
import Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";
import { getAdmin } from "./lib/admin";
import { takeStock, type OrderItem } from "./lib/order";

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
      if (status === "failed") {
        transaction.update(orderRef, { status });
        return;
      }

      // Paid: take the items out of stock in the same transaction, so the
      // order and the counts change together or not at all. Firestore
      // retries the transaction if another order changes a product first.
      const items = ((order.get("items") ?? []) as Partial<OrderItem>[]).filter(
        (item): item is OrderItem =>
          typeof item.id === "number" &&
          typeof item.size === "string" &&
          typeof item.quantity === "number",
      );
      const productRefs = [...new Set(items.map((item) => item.id))].map((id) =>
        admin.db.collection("products").doc(String(id)),
      );
      const products =
        productRefs.length > 0 ? await transaction.getAll(...productRefs) : [];
      const counts = new Map(
        products
          .filter((product) => product.exists)
          .map((product) => [
            Number(product.id),
            (product.get("stock") ?? {}) as Record<string, number>,
          ]),
      );
      const { stock, shortfall } = takeStock(items, counts);

      for (const [id, productStock] of stock) {
        transaction.update(admin.db.collection("products").doc(String(id)), {
          stock: productStock,
        });
      }
      if (shortfall.length > 0) {
        // Paid for, but more than was left: flag it for a refund or restock.
        console.warn(`Order ${paymentIntent.id} oversold`, shortfall);
      }
      transaction.update(orderRef, {
        status,
        amountReceived: paymentIntent.amount_received,
        paidAt: FieldValue.serverTimestamp(),
        ...(shortfall.length > 0 && { stockShortfall: shortfall }),
      });
    });
  } catch (error) {
    console.error("stripe-webhook failed to update order", error);
    return json(500, { error: "Could not update order." });
  }

  return json(200, { received: true });
};

export { handler };
