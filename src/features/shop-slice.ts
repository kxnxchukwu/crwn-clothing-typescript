import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import { getProducts } from "../firebase/firebase.utils";
import {
  CATEGORIES,
  type CategoryId,
  type Product,
} from "../catalogue/product";

interface ShopState {
  products: Product[];
  status: "idle" | "loading" | "succeeded" | "failed";
  errorMessage: string | undefined;
}

// A category's products, as the shop pages show them.
export interface Collection {
  id: CategoryId;
  title: string;
  routeName: string;
  items: Product[];
}

const initialState: ShopState = {
  products: [],
  status: "idle",
  errorMessage: undefined,
};

export const fetchProducts = createAsyncThunk(
  "shop/fetchProducts",
  getProducts,
);

export const shopSlice = createSlice({
  name: "shop",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = "failed";
        state.errorMessage = action.error.message;
      });
  },
});

type WithShop = { shop: ShopState };

export const selectProducts = (state: WithShop) => state.shop.products;

// Categories in shop order, each with its products; empty ones are left out.
export const selectCollectionsForPreview = createSelector(
  [selectProducts],
  (products): Collection[] =>
    CATEGORIES.map(({ id, title }) => ({
      id,
      title,
      routeName: id,
      items: products.filter((product) => product.category === id),
    })).filter((collection) => collection.items.length > 0),
);

// Undefined until products have loaded, or if the URL names no category.
export const selectCollection = (routeName: string) => (state: WithShop) =>
  selectCollectionsForPreview(state).find(
    (collection) => collection.routeName === routeName,
  );

// True until the first fetch settles, so pages never render with no data.
export const selectIsCollectionFetching = (state: WithShop) =>
  state.shop.status === "idle" || state.shop.status === "loading";

export default shopSlice.reducer;
