// @vitest-environment node
import type { HandlerEvent, HandlerContext } from "@netlify/functions";

const create = vi.fn();
const verifyIdToken = vi.fn();
const setOrder = vi.fn();
const doc = vi.fn(() => ({ set: setOrder }));
let adminConfigured = false;

vi.mock("stripe", () => ({
  default: class {
    paymentIntents = { create };
  },
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: () => "SERVER_TIME" },
}));

vi.mock("./lib/admin", () => ({
  getAdmin: () =>
    adminConfigured
      ? {
          auth: { verifyIdToken },
          db: { collection: () => ({ doc }) },
        }
      : null,
}));

vi.mock("./lib/catalogue", () => ({
  loadCatalogue: vi.fn(
    async () =>
      new Map([
        [1, { name: "Brown Brim", price: 25, imageUrl: "brim.png" }],
        [18, { name: "Black Jean Shearling", price: 125, imageUrl: "j.png" }],
      ]),
  ),
}));

const { handler } = await import("./create-payment-intent");

const call = async (
  body: unknown,
  { httpMethod = "POST", token }: { httpMethod?: string; token?: string } = {},
) => {
  const response = await handler(
    {
      httpMethod,
      headers: token ? { authorization: `Bearer ${token}` } : {},
      body: typeof body === "string" ? body : JSON.stringify(body),
    } as unknown as HandlerEvent,
    {} as HandlerContext,
  );
  if (!response) throw new Error("handler returned nothing");
  return {
    statusCode: response.statusCode,
    body: JSON.parse(response.body ?? "{}"),
  };
};

describe("create-payment-intent", () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    adminConfigured = false;
    vi.clearAllMocks();
    create.mockResolvedValue({ id: "pi_123", client_secret: "pi_123_secret" });
    verifyIdToken.mockResolvedValue({ uid: "user-1", email: "a@b.test" });
  });

  it("charges catalogue prices, not the amount the client sends", async () => {
    const response = await call({
      amount: 1,
      items: [
        { id: 1, quantity: 2, price: 0.01 },
        { id: 18, quantity: 1 },
      ],
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      clientSecret: "pi_123_secret",
      amount: 17500,
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 17500,
        currency: "eur",
        metadata: { items: "1x2,18x1", userId: "" },
      }),
    );
  });

  it("rejects unknown products without creating a payment", async () => {
    const response = await call({ items: [{ id: 999, quantity: 1 }] });
    expect(response.statusCode).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON and non-POST requests", async () => {
    expect((await call("{not json")).statusCode).toBe(400);
    expect((await call({ items: [] }, { httpMethod: "GET" })).statusCode).toBe(
      405,
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("hides Stripe errors from the client", async () => {
    create.mockRejectedValue(new Error("secret internal detail"));
    const response = await call({ items: [{ id: 1, quantity: 1 }] });
    expect(response.statusCode).toBe(502);
    expect(JSON.stringify(response.body)).not.toContain("secret internal");
  });

  it("fails clearly when the secret key is missing", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const response = await call({ items: [{ id: 1, quantity: 1 }] });
    expect(response.statusCode).toBe(500);
    expect(create).not.toHaveBeenCalled();
  });

  describe("order saving", () => {
    beforeEach(() => {
      adminConfigured = true;
    });

    it("saves a pending order for the verified user", async () => {
      const response = await call(
        { items: [{ id: 1, quantity: 2 }] },
        { token: "good-token" },
      );

      expect(response.statusCode).toBe(200);
      expect(verifyIdToken).toHaveBeenCalledWith("good-token");
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { items: "1x2", userId: "user-1" },
        }),
      );
      expect(doc).toHaveBeenCalledWith("pi_123");
      expect(setOrder).toHaveBeenCalledWith({
        status: "pending",
        userId: "user-1",
        email: "a@b.test",
        items: [
          {
            id: 1,
            name: "Brown Brim",
            imageUrl: "brim.png",
            price: 25,
            quantity: 2,
          },
        ],
        total: 5000,
        currency: "eur",
        paymentIntentId: "pi_123",
        createdAt: "SERVER_TIME",
      });
    });

    it("saves guest orders without a user", async () => {
      await call({ items: [{ id: 1, quantity: 1 }] });
      expect(verifyIdToken).not.toHaveBeenCalled();
      expect(setOrder).toHaveBeenCalledWith(
        expect.objectContaining({ userId: null, email: null }),
      );
    });

    it("rejects an invalid token instead of saving a guest order", async () => {
      verifyIdToken.mockRejectedValue(new Error("expired"));
      const response = await call(
        { items: [{ id: 1, quantity: 1 }] },
        { token: "expired-token" },
      );
      expect(response.statusCode).toBe(401);
      expect(create).not.toHaveBeenCalled();
      expect(setOrder).not.toHaveBeenCalled();
    });

    it("fails the request if the order can't be saved", async () => {
      setOrder.mockRejectedValue(new Error("firestore down"));
      const response = await call({ items: [{ id: 1, quantity: 1 }] });
      expect(response.statusCode).toBe(502);
    });
  });

  it("skips order saving when Firebase Admin isn't configured", async () => {
    const response = await call(
      { items: [{ id: 1, quantity: 1 }] },
      { token: "ignored" },
    );
    expect(response.statusCode).toBe(200);
    expect(verifyIdToken).not.toHaveBeenCalled();
    expect(setOrder).not.toHaveBeenCalled();
  });
});
