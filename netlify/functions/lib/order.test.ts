import {
  computeTotalCents,
  MAX_LINES,
  MAX_QUANTITY,
  parseOrderLines,
} from "./order";

const prices = new Map([
  [1, 25],
  [2, 12.5],
  [3, 0.2],
]);

describe("parseOrderLines", () => {
  it("accepts ids and quantities and merges duplicate ids", () => {
    expect(
      parseOrderLines({
        items: [
          { id: 1, quantity: 2 },
          { id: 2, quantity: 1 },
          { id: 1, quantity: 1 },
        ],
      }),
    ).toEqual({
      ok: true,
      value: [
        { id: 1, quantity: 3 },
        { id: 2, quantity: 1 },
      ],
    });
  });

  it("ignores any client-supplied price or amount", () => {
    const result = parseOrderLines({
      amount: 1,
      items: [{ id: 1, quantity: 1, price: 0.01 }],
    });
    expect(result).toEqual({ ok: true, value: [{ id: 1, quantity: 1 }] });
  });

  it.each([
    ["missing items", {}],
    ["empty cart", { items: [] }],
    ["not an object", null],
    ["zero quantity", { items: [{ id: 1, quantity: 0 }] }],
    ["negative quantity", { items: [{ id: 1, quantity: -2 }] }],
    ["fractional quantity", { items: [{ id: 1, quantity: 1.5 }] }],
    ["string id", { items: [{ id: "1", quantity: 1 }] }],
    [
      "quantity over the limit",
      { items: [{ id: 1, quantity: MAX_QUANTITY + 1 }] },
    ],
    [
      "too many lines",
      {
        items: Array.from({ length: MAX_LINES + 1 }, (_, i) => ({
          id: i + 1,
          quantity: 1,
        })),
      },
    ],
  ])("rejects %s", (_, body) => {
    expect(parseOrderLines(body).ok).toBe(false);
  });
});

describe("computeTotalCents", () => {
  it("prices the order from the catalogue, in cents", () => {
    expect(
      computeTotalCents(
        [
          { id: 1, quantity: 3 },
          { id: 2, quantity: 1 },
        ],
        prices,
      ),
    ).toEqual({ ok: true, value: 8750 });
  });

  it("rejects unknown products", () => {
    expect(computeTotalCents([{ id: 99, quantity: 1 }], prices).ok).toBe(false);
  });

  it("rejects totals below Stripe's minimum", () => {
    expect(computeTotalCents([{ id: 3, quantity: 1 }], prices).ok).toBe(false);
  });
});
