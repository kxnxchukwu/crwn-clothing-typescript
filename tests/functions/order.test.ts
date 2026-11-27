import {
  checkStock,
  computeTotalCents,
  takeStock,
  MAX_LINES,
  MAX_QUANTITY,
  parseOrderLines,
  type StockedItem,
} from "../../netlify/functions/lib/order";

const prices = new Map([
  [1, 25],
  [2, 12.5],
  [3, 0.2],
]);

describe("parseOrderLines", () => {
  it("keeps sizes of the same product on separate lines", () => {
    expect(
      parseOrderLines({
        items: [
          { id: 1, size: "S", quantity: 1 },
          { id: 1, size: "M", quantity: 2 },
        ],
      }),
    ).toEqual({
      ok: true,
      value: [
        { id: 1, size: "S", quantity: 1 },
        { id: 1, size: "M", quantity: 2 },
      ],
    });
  });

  it("accepts ids and quantities and merges duplicate ids", () => {
    expect(
      parseOrderLines({
        items: [
          { id: 1, size: "M", quantity: 2 },
          { id: 2, size: "M", quantity: 1 },
          { id: 1, size: "M", quantity: 1 },
        ],
      }),
    ).toEqual({
      ok: true,
      value: [
        { id: 1, size: "M", quantity: 3 },
        { id: 2, size: "M", quantity: 1 },
      ],
    });
  });

  it("ignores any client-supplied price or amount", () => {
    const result = parseOrderLines({
      amount: 1,
      items: [{ id: 1, size: "M", quantity: 1, price: 0.01 }],
    });
    expect(result).toEqual({
      ok: true,
      value: [{ id: 1, size: "M", quantity: 1 }],
    });
  });

  it.each([
    ["missing items", {}],
    ["empty cart", { items: [] }],
    ["not an object", null],
    ["zero quantity", { items: [{ id: 1, size: "M", quantity: 0 }] }],
    ["negative quantity", { items: [{ id: 1, size: "M", quantity: -2 }] }],
    ["fractional quantity", { items: [{ id: 1, size: "M", quantity: 1.5 }] }],
    ["string id", { items: [{ id: "1", size: "M", quantity: 1 }] }],
    ["missing size", { items: [{ id: 1, quantity: 1 }] }],
    ["blank size", { items: [{ id: 1, size: " ", quantity: 1 }] }],
    [
      "very long size",
      { items: [{ id: 1, size: "M".repeat(21), quantity: 1 }] },
    ],
    [
      "quantity over the limit",
      { items: [{ id: 1, size: "M", quantity: MAX_QUANTITY + 1 }] },
    ],
    [
      "too many lines",
      {
        items: Array.from({ length: MAX_LINES + 1 }, (_, i) => ({
          id: i + 1,
          size: "M",
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
          { id: 1, size: "M", quantity: 3 },
          { id: 2, size: "M", quantity: 1 },
        ],
        prices,
      ),
    ).toEqual({ ok: true, value: 8750 });
  });

  it("rejects unknown products", () => {
    expect(
      computeTotalCents([{ id: 99, size: "M", quantity: 1 }], prices).ok,
    ).toBe(false);
  });

  it("rejects totals below Stripe's minimum", () => {
    expect(
      computeTotalCents([{ id: 3, size: "M", quantity: 1 }], prices).ok,
    ).toBe(false);
  });
});

const catalogue = new Map<number, StockedItem>([
  [1, { name: "Brown Brim", sizes: ["One size"], stock: { "One size": 2 } }],
  [18, { name: "Jacket", sizes: ["S", "M", "L"], stock: { S: 0, M: 3, L: 1 } }],
]);

describe("checkStock", () => {
  it("passes lines that are in stock", () => {
    expect(
      checkStock(
        [
          { id: 1, size: "One size", quantity: 2 },
          { id: 18, size: "M", quantity: 3 },
        ],
        catalogue,
      ),
    ).toEqual({ ok: true, value: null });
  });

  it.each([
    [{ id: 18, size: "S", quantity: 1 }, "Jacket in S is sold out."],
    [{ id: 18, size: "L", quantity: 2 }, "Only 1 left of Jacket in L."],
    // One-size products don't mention the size.
    [{ id: 1, size: "One size", quantity: 3 }, "Only 2 left of Brown Brim."],
    [{ id: 18, size: "XXL", quantity: 1 }, "Invalid item in cart."],
    [
      { id: 99, size: "M", quantity: 1 },
      "An item in your cart is no longer available.",
    ],
  ])("rejects %o", (line, error) => {
    expect(checkStock([line], catalogue)).toEqual({ ok: false, error });
  });
});

describe("takeStock", () => {
  const counts = () =>
    new Map<number, Record<string, number>>([
      [1, { "One size": 2 }],
      [18, { S: 0, M: 3, L: 1 }],
    ]);

  it("takes paid lines out of stock without changing the input", () => {
    const before = counts();
    const result = takeStock(
      [
        { id: 18, size: "M", quantity: 2 },
        { id: 18, size: "L", quantity: 1 },
      ],
      before,
    );
    expect(result.stock.get(18)).toEqual({ S: 0, M: 1, L: 0 });
    expect(result.stock.get(1)).toEqual({ "One size": 2 });
    expect(result.shortfall).toEqual([]);
    expect(before.get(18)).toEqual({ S: 0, M: 3, L: 1 });
  });

  it("stops at 0 and reports what was oversold", () => {
    const result = takeStock(
      [{ id: 1, size: "One size", quantity: 3 }],
      counts(),
    );
    expect(result.stock.get(1)).toEqual({ "One size": 0 });
    expect(result.shortfall).toEqual([{ id: 1, size: "One size", missing: 1 }]);
  });

  it("skips products that no longer exist", () => {
    const result = takeStock([{ id: 99, size: "M", quantity: 1 }], counts());
    expect(result.shortfall).toEqual([]);
    expect([...result.stock.keys()]).toEqual([1, 18]);
  });
});
