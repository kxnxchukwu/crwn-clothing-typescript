import { combineReducers } from "@reduxjs/toolkit";
import userReducer from "../features/user-slice";
import cartReducer from "../features/cart-slice";
import directoryReducer from "../features/directory-slice";
import shopReducer from "../features/shop-slice";
import themeReducer from "../features/theme-slice";

// Kept apart from store.ts so tests can build a fresh, non-persisted store.
export const rootReducer = combineReducers({
  user: userReducer,
  cart: cartReducer,
  directory: directoryReducer,
  shop: shopReducer,
  theme: themeReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
