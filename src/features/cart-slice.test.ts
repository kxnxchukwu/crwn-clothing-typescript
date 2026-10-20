import cartReducer, {
  addItem,
  removeCartItem,
  clearItemFromCart,
  selectCartItemsCount,
  selectCartTotal,
  Item,
} from "./cart-slice";

const hat: Item = { id: 1, name: "Brown Brim", imageUrl: "", price: 25, quantity: 0 };
const beanie: Item = { id: 2, name: "Blue Beanie", imageUrl: "", price: 18, quantity: 0 };

const empty = cartReducer(undefined, { type: "@@INIT" });

describe("cart slice", () => {
  it("adds new items with quantity 1 and increments existing ones", () => {
    let state = cartReducer(empty, addItem({ item: hat }));
    state = cartReducer(state, addItem({ item: beanie }));
    state = cartReducer(state, addItem({ item: hat }));

    expect(state.cartItems).toEqual([
      { ...hat, quantity: 2 },
      { ...beanie, quantity: 1 },
    ]);
    expect(selectCartItemsCount({ cart: state })).toBe(3);
    expect(selectCartTotal({ cart: state })).toBe(68);
  });

  it("decrements, then removes an item when its quantity reaches zero", () => {
    let state = cartReducer(empty, addItem({ item: hat }));
    state = cartReducer(state, addItem({ item: hat }));
    state = cartReducer(state, removeCartItem({ item: hat }));
    expect(state.cartItems).toEqual([{ ...hat, quantity: 1 }]);

    state = cartReducer(state, removeCartItem({ item: hat }));
    expect(state.cartItems).toEqual([]);
  });

  it("clears an item regardless of quantity", () => {
    let state = cartReducer(empty, addItem({ item: hat }));
    state = cartReducer(state, addItem({ item: hat }));
    state = cartReducer(state, clearItemFromCart({ item: hat }));
    expect(state.cartItems).toEqual([]);
  });
});
