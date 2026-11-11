import shopReducer, {
  fetchProducts,
  selectCollection,
  selectCollectionsForPreview,
  selectIsCollectionFetching,
} from "../shop-slice";
import { beanieProduct, hatProduct, jacketProduct } from "../../test/render";

vi.mock("../../firebase/firebase.utils", () => ({ getProducts: vi.fn() }));

const asRoot = (shop: ReturnType<typeof shopReducer>) => ({ shop });

const loaded = () =>
  asRoot(
    shopReducer(
      undefined,
      // Out of category order on purpose: the shop orders categories itself.
      fetchProducts.fulfilled(
        [jacketProduct, hatProduct, beanieProduct],
        "req",
        undefined,
      ),
    ),
  );

describe("shop slice", () => {
  it("reports fetching before the first fetch starts, so pages show a spinner", () => {
    const idle = shopReducer(undefined, { type: "@@INIT" });
    expect(selectIsCollectionFetching(asRoot(idle))).toBe(true);
  });

  it("stops fetching once products load", () => {
    const pending = shopReducer(
      undefined,
      fetchProducts.pending("req", undefined),
    );
    expect(selectIsCollectionFetching(asRoot(pending))).toBe(true);
    expect(selectIsCollectionFetching(loaded())).toBe(false);
  });

  it("groups products into categories in shop order, skipping empty ones", () => {
    const collections = selectCollectionsForPreview(loaded());
    expect(collections.map((c) => c.title)).toEqual(["Hats", "Jackets"]);
    expect(collections[0]).toEqual({
      id: "hats",
      title: "Hats",
      routeName: "hats",
      items: [hatProduct, beanieProduct],
    });
  });

  it("finds a category by its URL name", () => {
    const state = loaded();
    expect(selectCollection("jackets")(state)?.items).toEqual([jacketProduct]);
    expect(selectCollection("socks")(state)).toBeUndefined();
    // Same object between calls, so components don't re-render needlessly.
    expect(selectCollection("hats")(state)).toBe(
      selectCollection("hats")(state),
    );
  });

  it("stops fetching and keeps the error message on failure", () => {
    const state = shopReducer(
      undefined,
      fetchProducts.rejected(new Error("offline"), "req", undefined),
    );
    expect(selectIsCollectionFetching(asRoot(state))).toBe(false);
    expect(state.errorMessage).toBe("offline");
  });
});
