import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
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
import userReducer from "../features/user-slice";
import cartReducer, { CartState } from "../features/cart-slice";
import directoryReducer from "../features/directory-slice";
import shopReducer from "../features/shop-slice";
import themeReducer from "../features/theme-slice";

const rootReducer = combineReducers({
  user: userReducer,
  cart: cartReducer,
  directory: directoryReducer,
  shop: shopReducer,
  theme: themeReducer,
});

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

const persistedReducer = persistReducer<ReturnType<typeof rootReducer>>(
  {
    key: "root",
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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
