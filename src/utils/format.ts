const wholeEuro = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const euro = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
});

// €25, €12.50
export const formatPrice = (amount: number) =>
  (Number.isInteger(amount) ? wholeEuro : euro).format(amount);
