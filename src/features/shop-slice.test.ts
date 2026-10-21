import shopReducer, {
  fetchCollections,
  selectCollection,
  selectIsCollectionFetching,
} from "./shop-slice";

vi.mock("../firebase/firebase.utils", () => ({ getCollections: vi.fn() }));

const hats = { id: "a1", title: "Hats", routeName: "hats", items: [] };

const asRoot = (shop: ReturnType<typeof shopReducer>) => ({ shop });

describe("shop slice", () => {
  it("reports fetching before the first fetch starts, so pages show a spinner", () => {
    const idle = shopReducer(undefined, { type: "@@INIT" });
    expect(selectIsCollectionFetching(asRoot(idle))).toBe(true);
  });

  it("stores collections and stops fetching once loaded", () => {
    let state = shopReducer(
      undefined,
      fetchCollections.pending("req", undefined),
    );
    expect(selectIsCollectionFetching(asRoot(state))).toBe(true);

    state = shopReducer(
      state,
      fetchCollections.fulfilled({ hats }, "req", undefined),
    );
    expect(selectIsCollectionFetching(asRoot(state))).toBe(false);
    expect(selectCollection("hats")(asRoot(state))).toEqual(hats);
    expect(selectCollection("socks")(asRoot(state))).toBeUndefined();
  });

  it("stops fetching and keeps the error message on failure", () => {
    const state = shopReducer(
      undefined,
      fetchCollections.rejected(new Error("offline"), "req", undefined),
    );
    expect(selectIsCollectionFetching(asRoot(state))).toBe(false);
    expect(state.errorMessage).toBe("offline");
  });
});
