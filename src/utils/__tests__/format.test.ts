import { formatPrice } from "../format";

describe("formatPrice", () => {
  it("drops cents for whole euros and keeps them otherwise", () => {
    expect(formatPrice(25)).toBe("€25");
    expect(formatPrice(12.5)).toBe("€12.50");
  });
});
