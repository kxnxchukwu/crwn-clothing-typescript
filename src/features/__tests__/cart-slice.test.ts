import cartReducer, {
  addItem,
  removeCartItem,
  clearItemFromCart,
  setCartOpen,
  selectCartItemsCount,
  selectCartTotal,
  selectQuantityInCart,
  Item,
} from "../cart-slice";

const hat: Item = {
  id: 1,
  name: "Brown Brim",
  imageUrl: "",
  price: 25,
  size: "One size",
  quantity: 0,
};
const beanie: Item = {
  id: 2,
  name: "Blue Beanie",
  imageUrl: "",
  price: 18,
  size: "One size",
  quantity: 0,
};
const jacketM: Item = {
  id: 18,
  name: "Black Jean Shearling",
  imageUrl: "",
  price: 125,
  size: "M",
  quantity: 0,
};
const jacketL: Item = { ...jacketM, size: "L" };

const add = (
  state: ReturnType<typeof cartReducer>,
  item: Item,
  quantity?: number,
) => cartReducer(state, addItem({ item, size: item.size, quantity }));

const empty = cartReducer(undefined, { type: "@@INIT" });

describe("cart slice", () => {
  it("stores only cart fields when given a full product", () => {
    const state = cartReducer(
      empty,
      addItem({
        item: {
          ...hat,
          category: "hats",
          description: "A hat.",
          sizes: ["One size"],
          stock: { "One size": 3 },
        } as Item,
        size: "One size",
      }),
    );
    expect(state.cartItems).toEqual([{ ...hat, quantity: 1 }]);
  });

  it("adds new items with quantity 1 and increments existing ones", () => {
    let state = add(empty, hat);
    state = add(state, beanie);
    state = add(state, hat);

    expect(state.cartItems).toEqual([
      { ...hat, quantity: 2 },
      { ...beanie, quantity: 1 },
    ]);
    expect(selectCartItemsCount({ cart: state })).toBe(3);
    expect(selectCartTotal({ cart: state })).toBe(68);
  });

  it("adds several at once", () => {
    const state = add(add(empty, jacketM, 2), jacketM, 3);
    expect(state.cartItems).toEqual([{ ...jacketM, quantity: 5 }]);
  });

  it("keeps each size of a product on its own line", () => {
    let state = add(empty, jacketM);
    state = add(state, jacketL);
    state = add(state, jacketM);

    expect(state.cartItems).toEqual([
      { ...jacketM, quantity: 2 },
      { ...jacketL, quantity: 1 },
    ]);
    expect(selectQuantityInCart(18, "M")({ cart: state })).toBe(2);
    expect(selectQuantityInCart(18, "XL")({ cart: state })).toBe(0);

    state = cartReducer(state, clearItemFromCart({ item: jacketM }));
    expect(state.cartItems).toEqual([{ ...jacketL, quantity: 1 }]);
  });

  it("decrements, then removes an item when its quantity reaches zero", () => {
    let state = add(add(empty, hat), hat);
    state = cartReducer(state, removeCartItem({ item: hat }));
    expect(state.cartItems).toEqual([{ ...hat, quantity: 1 }]);

    state = cartReducer(state, removeCartItem({ item: hat }));
    expect(state.cartItems).toEqual([]);
  });

  it("clears an item regardless of quantity", () => {
    let state = add(add(empty, hat), hat);
    state = cartReducer(state, clearItemFromCart({ item: hat }));
    expect(state.cartItems).toEqual([]);
  });

  it("starts closed and opens or closes the cart drawer", () => {
    expect(empty.hidden).toBe(true);
    const open = cartReducer(empty, setCartOpen(true));
    expect(open.hidden).toBe(false);
    expect(cartReducer(open, setCartOpen(false)).hidden).toBe(true);
  });
});
