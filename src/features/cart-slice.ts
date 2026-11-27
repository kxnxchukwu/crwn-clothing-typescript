import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { signOut } from "./user-slice";

// One cart line: a product in one size. The same product in two sizes is
// two lines.
export interface Item {
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
  id: number;
  size: string;
}

// Anything with these fields can go in the cart (a Product, or a cart line).
export type CartProduct = Omit<Item, "quantity" | "size">;

const sameLine = (a: Pick<Item, "id" | "size">, b: Pick<Item, "id" | "size">) =>
  a.id === b.id && a.size === b.size;

export interface CartState {
  cartItems: Item[];
  hidden: boolean;
}

const initialState: CartState = { cartItems: [], hidden: true };

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Accepts a full product but stores only what a cart line needs, so
    // descriptions don't end up in the persisted cart.
    addItem: (
      state,
      action: PayloadAction<{
        item: CartProduct;
        size: string;
        quantity?: number;
      }>,
    ) => {
      const { item, size, quantity = 1 } = action.payload;
      const { id, name, imageUrl, price } = item;
      const existing = state.cartItems.find((line) =>
        sameLine(line, { id, size }),
      );
      if (existing) existing.quantity += quantity;
      else state.cartItems.push({ id, name, imageUrl, price, size, quantity });
    },
    removeCartItem: (state, action: PayloadAction<{ item: Item }>) => {
      const { item } = action.payload;
      const existing = state.cartItems.find((line) => sameLine(line, item));
      if (!existing) return;
      if (existing.quantity > 1) existing.quantity -= 1;
      else
        state.cartItems = state.cartItems.filter((line) => line !== existing);
    },
    clearItemFromCart: (state, action: PayloadAction<{ item: Item }>) => {
      state.cartItems = state.cartItems.filter(
        (line) => !sameLine(line, action.payload.item),
      );
    },
    clearCart: (state) => {
      state.cartItems = [];
    },
    setCartOpen: (state, action: PayloadAction<boolean>) => {
      state.hidden = !action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(signOut.fulfilled, (state) => {
      state.cartItems = [];
    });
  },
});

export const {
  setCartOpen,
  addItem,
  removeCartItem,
  clearItemFromCart,
  clearCart,
} = cartSlice.actions;

export const selectCardHidden = (state: { cart: CartState }) =>
  state.cart.hidden;

export const selectCartItems = (state: { cart: CartState }) =>
  state.cart.cartItems;

export const selectCartItemsCount = (state: { cart: CartState }) =>
  state.cart.cartItems.reduce(
    (accumalatedQuantity: number, cartItems: Item) =>
      accumalatedQuantity + cartItems.quantity,
    0,
  );

export const selectCartTotal = (state: { cart: CartState }) =>
  state.cart.cartItems.reduce(
    (accumalatedQuantity: number, cartItems: Item) =>
      accumalatedQuantity + cartItems.quantity * cartItems.price,
    0,
  );

// How many of one product in one size are already in the cart.
export const selectQuantityInCart =
  (id: number, size: string | undefined) => (state: { cart: CartState }) =>
    state.cart.cartItems.find((line) => line.id === id && line.size === size)
      ?.quantity ?? 0;

export default cartSlice.reducer;
