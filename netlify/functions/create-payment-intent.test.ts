// @vitest-environment node
import type { HandlerEvent, HandlerContext } from "@netlify/functions";

const create = vi.fn();

vi.mock("stripe", () => ({
  default: class {
    paymentIntents = { create };
  },
}));

vi.mock("./lib/prices", () => ({
  loadPrices: vi.fn(
    async () =>
      new Map([
        [1, 25],
        [18, 125],
      ]),
  ),
}));

const { handler } = await import("./create-payment-intent");

const call = async (body: unknown, httpMethod = "POST") => {
  const response = await handler(
    {
      httpMethod,
      body: typeof body === "string" ? body : JSON.stringify(body),
    } as HandlerEvent,
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
    create.mockReset();
    create.mockResolvedValue({ client_secret: "pi_123_secret_456" });
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
      clientSecret: "pi_123_secret_456",
      amount: 17500,
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 17500,
        currency: "eur",
        metadata: { items: "1x2,18x1" },
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
    expect((await call({ items: [] }, "GET")).statusCode).toBe(405);
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
});
