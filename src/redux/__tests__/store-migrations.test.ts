import { migrations } from "../store";

describe("persisted state migrations", () => {
  it("drops cart lines saved before sizes existed", () => {
    const saved = {
      cart: {
        cartItems: [
          { id: 1, name: "Brown Brim", quantity: 2 },
          { id: 18, name: "Jacket", size: "M", quantity: 1 },
        ],
      },
      theme: { theme: "dark" },
    };
    expect(migrations[1](saved)).toEqual({
      cart: { cartItems: [{ id: 18, name: "Jacket", size: "M", quantity: 1 }] },
      theme: { theme: "dark" },
    });
  });

  it("leaves state without a cart alone", () => {
    expect(migrations[1]({ theme: { theme: "light" } })).toEqual({
      theme: { theme: "light" },
    });
  });
});
