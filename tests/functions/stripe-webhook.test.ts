// @vitest-environment node
import type { HandlerEvent, HandlerContext } from "@netlify/functions";

const constructEvent = vi.fn();
const update = vi.fn();
let storedOrder: { status: string; items?: unknown[] } | null = null;
let storedStock: Record<string, Record<string, number>> = {};
let adminConfigured = true;

vi.mock("stripe", () => ({
  default: class {
    webhooks = { constructEvent };
  },
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: () => "SERVER_TIME" },
}));

vi.mock("../../netlify/functions/lib/admin", () => ({
  getAdmin: () =>
    adminConfigured
      ? {
          db: {
            collection: (name: string) => ({
              doc: (id: string) => ({ path: `${name}/${id}`, id }),
            }),
            runTransaction: async (
              fn: (transaction: unknown) => Promise<void>,
            ) =>
              fn({
                get: async () => ({
                  exists: storedOrder !== null,
                  get: (field: "status" | "items") => storedOrder?.[field],
                }),
                getAll: async (...refs: { id: string }[]) =>
                  refs.map(({ id }) => ({
                    id,
                    exists: id in storedStock,
                    get: () => storedStock[id],
                  })),
                update,
              }),
          },
        }
      : null,
}));

const { handler } = await import("../../netlify/functions/stripe-webhook");

const call = async (body = "{}") => {
  const response = await handler(
    {
      httpMethod: "POST",
      headers: { "stripe-signature": "sig" },
      body,
      isBase64Encoded: false,
    } as unknown as HandlerEvent,
    {} as HandlerContext,
  );
  if (!response) throw new Error("handler returned nothing");
  return response.statusCode;
};

const stripeEvent = (type: string) => ({
  type,
  data: { object: { id: "pi_123", amount_received: 5000 } },
});

describe("stripe-webhook", () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_dummy";
    adminConfigured = true;
    storedOrder = { status: "pending" };
    storedStock = {};
    vi.clearAllMocks();
  });

  it("verifies the signature against the raw body", async () => {
    constructEvent.mockReturnValue(stripeEvent("payment_intent.succeeded"));
    await call('{"raw":true}');
    expect(constructEvent).toHaveBeenCalledWith(
      '{"raw":true}',
      "sig",
      "whsec_dummy",
    );
  });

  it("rejects requests with a bad signature", async () => {
    constructEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });
    expect(await call()).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });

  it("marks a pending order as paid", async () => {
    constructEvent.mockReturnValue(stripeEvent("payment_intent.succeeded"));
    expect(await call()).toBe(200);
    expect(update).toHaveBeenCalledWith(
      { path: "orders/pi_123", id: "pi_123" },
      { status: "paid", amountReceived: 5000, paidAt: "SERVER_TIME" },
    );
  });

  it("takes paid items out of stock with the order", async () => {
    storedOrder = {
      status: "pending",
      items: [
        { id: 18, size: "M", quantity: 2 },
        { id: 18, size: "L", quantity: 1 },
        { id: 1, size: "One size", quantity: 1 },
      ],
    };
    storedStock = { "18": { S: 1, M: 3, L: 1 }, "1": { "One size": 4 } };
    constructEvent.mockReturnValue(stripeEvent("payment_intent.succeeded"));

    expect(await call()).toBe(200);
    expect(update).toHaveBeenCalledWith(
      { path: "products/18", id: "18" },
      { stock: { S: 1, M: 1, L: 0 } },
    );
    expect(update).toHaveBeenCalledWith(
      { path: "products/1", id: "1" },
      { stock: { "One size": 3 } },
    );
    expect(update).toHaveBeenCalledWith(
      { path: "orders/pi_123", id: "pi_123" },
      { status: "paid", amountReceived: 5000, paidAt: "SERVER_TIME" },
    );
  });

  it("flags an order that paid for more than was left", async () => {
    storedOrder = {
      status: "pending",
      items: [{ id: 18, size: "L", quantity: 2 }],
    };
    storedStock = { "18": { L: 1 } };
    constructEvent.mockReturnValue(stripeEvent("payment_intent.succeeded"));
    vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(await call()).toBe(200);
    expect(update).toHaveBeenCalledWith(
      { path: "products/18", id: "18" },
      { stock: { L: 0 } },
    );
    expect(update).toHaveBeenCalledWith(
      { path: "orders/pi_123", id: "pi_123" },
      expect.objectContaining({
        status: "paid",
        stockShortfall: [{ id: 18, size: "L", missing: 1 }],
      }),
    );
  });

  it("marks a failed payment as failed", async () => {
    constructEvent.mockReturnValue(
      stripeEvent("payment_intent.payment_failed"),
    );
    expect(await call()).toBe(200);
    expect(update).toHaveBeenCalledWith(
      { path: "orders/pi_123", id: "pi_123" },
      { status: "failed" },
    );
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("never takes stock twice when Stripe repeats an event", async () => {
    storedOrder = {
      status: "paid",
      items: [{ id: 18, size: "M", quantity: 1 }],
    };
    storedStock = { "18": { M: 3 } };
    constructEvent.mockReturnValue(stripeEvent("payment_intent.succeeded"));
    expect(await call()).toBe(200);
    expect(update).not.toHaveBeenCalled();
  });

  it("acknowledges payments with no saved order", async () => {
    storedOrder = null;
    constructEvent.mockReturnValue(stripeEvent("payment_intent.succeeded"));
    expect(await call()).toBe(200);
    expect(update).not.toHaveBeenCalled();
  });

  it("ignores other event types", async () => {
    constructEvent.mockReturnValue(stripeEvent("charge.refunded"));
    expect(await call()).toBe(200);
    expect(update).not.toHaveBeenCalled();
  });

  it("asks Stripe to retry when not configured", async () => {
    adminConfigured = false;
    expect(await call()).toBe(500);
    delete process.env.STRIPE_WEBHOOK_SECRET;
    adminConfigured = true;
    expect(await call()).toBe(500);
    expect(constructEvent).not.toHaveBeenCalled();
  });
});
