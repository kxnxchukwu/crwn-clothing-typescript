import { configureStore } from "@reduxjs/toolkit";
import {
  createMigrate,
  persistStore,
  createTransform,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import type { CartState } from "../features/cart-slice";
import { rootReducer, type RootState } from "./root-reducer";

// Persist cart items but not whether the dropdown is open, so every page load
// starts with it closed (including for visitors who saved it open before).
const cartDropdownClosed = createTransform(
  ({ cartItems }: CartState) => ({ cartItems }),
  (cart: Pick<CartState, "cartItems">): CartState => ({
    ...cart,
    hidden: true,
  }),
  { whitelist: ["cart"] },
);

// Version 1 added sizes to cart lines. Lines saved before that can't be
// bought any more (the server needs a size), so they're dropped once.
export const migrations = {
  1: (state: unknown) => {
    const saved = state as { cart?: { cartItems?: { size?: unknown }[] } };
    if (!saved?.cart?.cartItems) return state as never;
    return {
      ...saved,
      cart: {
        ...saved.cart,
        cartItems: saved.cart.cartItems.filter(
          (line) => typeof line.size === "string",
        ),
      },
    } as never;
  },
};

const persistedReducer = persistReducer<RootState>(
  {
    key: "root",
    version: 1,
    migrate: createMigrate(migrations),
    storage,
    whitelist: ["cart", "theme"],
    transforms: [cartDropdownClosed],
  },
  rootReducer,
);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // redux-persist puts functions in these actions.
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type { RootState };
export type AppDispatch = typeof store.dispatch;
