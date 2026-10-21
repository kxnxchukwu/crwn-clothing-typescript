// @vitest-environment node
import type { HandlerEvent, HandlerContext } from "@netlify/functions";

const constructEvent = vi.fn();
const update = vi.fn();
let storedOrder: { status: string } | null = null;
let adminConfigured = true;

vi.mock("stripe", () => ({
  default: class {
    webhooks = { constructEvent };
  },
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: () => "SERVER_TIME" },
}));

vi.mock("./lib/admin", () => ({
  getAdmin: () =>
    adminConfigured
      ? {
          db: {
            collection: () => ({ doc: (id: string) => ({ id }) }),
            runTransaction: async (
              fn: (transaction: unknown) => Promise<void>,
            ) =>
              fn({
                get: async () => ({
                  exists: storedOrder !== null,
                  get: (field: "status") => storedOrder?.[field],
                }),
                update,
              }),
          },
        }
      : null,
}));

const { handler } = await import("./stripe-webhook");

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
      { id: "pi_123" },
      { status: "paid", amountReceived: 5000, paidAt: "SERVER_TIME" },
    );
  });

  it("marks a failed payment as failed", async () => {
    constructEvent.mockReturnValue(
      stripeEvent("payment_intent.payment_failed"),
    );
    expect(await call()).toBe(200);
    expect(update).toHaveBeenCalledWith({ id: "pi_123" }, { status: "failed" });
  });

  it("is safe when Stripe repeats an event for a paid order", async () => {
    storedOrder = { status: "paid" };
    constructEvent.mockReturnValue(
      stripeEvent("payment_intent.payment_failed"),
    );
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
