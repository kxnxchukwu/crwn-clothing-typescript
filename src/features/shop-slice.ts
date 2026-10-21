import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createSelector } from "@reduxjs/toolkit";
import { Collection, getCollections } from "../firebase/firebase.utils";

interface ShopState {
  collections: Record<string, Collection>;
  status: "idle" | "loading" | "succeeded" | "failed";
  errorMessage: string | undefined;
}

const initialState: ShopState = {
  collections: {},
  status: "idle",
  errorMessage: undefined,
};

export const fetchCollections = createAsyncThunk(
  "shop/fetchCollections",
  getCollections,
);

export const shopSlice = createSlice({
  name: "shop",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCollections.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCollections.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.collections = action.payload;
      })
      .addCase(fetchCollections.rejected, (state, action) => {
        state.status = "failed";
        state.errorMessage = action.error.message;
      });
  },
});

export const selectShop = (state: { shop: ShopState }) => state.shop;

export const selectCollections = (state: { shop: ShopState }) =>
  state.shop.collections;

export const selectCollectionsForPreview = createSelector(
  [selectCollections],
  (collections) => Object.values(collections),
);

// Undefined until collections have loaded, or if the URL names no collection.
export const selectCollection = (collectionUrlParam: string) =>
  createSelector(
    [selectCollections],
    (collections): Collection | undefined => collections[collectionUrlParam],
  );

// True until the first fetch settles, so pages never render with no data.
export const selectIsCollectionFetching = createSelector(
  [selectShop],
  (shop) => shop.status === "idle" || shop.status === "loading",
);

export default shopSlice.reducer;
