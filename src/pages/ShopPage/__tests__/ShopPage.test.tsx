import { act, fireEvent, screen, within } from "@testing-library/react";
import { Route, Routes, useLocation } from "react-router";
import ShopPage from "../ShopPage";
import { renderWithProviders, shopState } from "../../../test/render";
import { firebaseUtilsMock } from "../../../test/firebase-mock";

vi.mock(
  "../../../firebase/firebase.utils",
  async () => (await import("../../../test/firebase-mock")).firebaseUtilsMock,
);

// Shows the current URL so tests can check what the page wrote to it.
function Location() {
  const { pathname, search } = useLocation();
  return <output aria-label="URL">{pathname + search}</output>;
}

const openShop = (
  route = "/shop",
  status: "loading" | "succeeded" | "failed" = "succeeded",
) =>
  renderWithProviders(
    <>
      <Routes>
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/:id" element={<ShopPage />} />
      </Routes>
      <Location />
    </>,
    { route, path: "*", state: { shop: shopState(status) } },
  );

const url = () => screen.getByRole("status", { name: "URL" });
const names = () =>
  screen
    .queryAllByRole("link", { name: /Brown Brim|Blue Beanie|Black Jean/ })
    .map((link) => link.textContent);
const search = () => screen.getByRole("searchbox", { name: "Search products" });

describe("ShopPage", () => {
  afterEach(() => vi.useRealTimers());

  it("lists every product with a count", () => {
    openShop();
    expect(
      screen.getByRole("heading", { level: 1, name: "Shop" }),
    ).toBeInTheDocument();
    expect(screen.getByText("3 products")).toBeInTheDocument();
    expect(names()).toEqual([
      "Brown Brim",
      "Blue Beanie",
      "Black Jean Shearling",
    ]);
    expect(document.title).toBe("Shop — CRWN Clothing");
  });

  it("shows one category with a breadcrumb and the active chip", () => {
    openShop("/shop/hats");
    expect(
      screen.getByRole("heading", { level: 1, name: "Hats" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 products")).toBeInTheDocument();
    const chips = screen.getByRole("navigation", { name: "Categories" });
    expect(within(chips).getByRole("link", { name: "Hats" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(names()).toEqual(["Brown Brim", "Blue Beanie"]);
  });

  it("filters as you type and writes the search to the URL once typing pauses", async () => {
    vi.useFakeTimers();
    openShop();

    fireEvent.change(search(), { target: { value: "blue" } });
    expect(names()).toEqual(["Blue Beanie"]);
    expect(screen.getByText("1 product for “blue”")).toBeInTheDocument();
    expect(url()).toHaveTextContent(/^\/shop$/);

    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(url()).toHaveTextContent("/shop?q=blue");
  });

  it("reads the search and sort from the URL", () => {
    openShop("/shop?q=b&sort=price-desc");
    expect(search()).toHaveValue("b");
    expect(screen.getByRole("combobox", { name: "Sort by" })).toHaveValue(
      "price-desc",
    );
    expect(names()).toEqual([
      "Black Jean Shearling",
      "Brown Brim",
      "Blue Beanie",
    ]);
  });

  it("sorts and keeps the choice in the URL", async () => {
    const { user } = openShop("/shop?q=b");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Sort by" }),
      "price-asc",
    );
    expect(names()).toEqual([
      "Blue Beanie",
      "Brown Brim",
      "Black Jean Shearling",
    ]);
    expect(url()).toHaveTextContent("/shop?q=b&sort=price-asc");

    // Back to the default order drops the param.
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Sort by" }),
      "featured",
    );
    expect(url()).toHaveTextContent(/^\/shop\?q=b$/);
  });

  it("keeps the search and sort when switching category", async () => {
    const { user } = openShop("/shop?q=blue&sort=name");
    const chips = screen.getByRole("navigation", { name: "Categories" });
    await user.click(within(chips).getByRole("link", { name: "Hats" }));
    expect(url()).toHaveTextContent("/shop/hats?q=blue&sort=name");
    expect(names()).toEqual(["Blue Beanie"]);
  });

  it("points to matches in other categories when a category has none", async () => {
    const { user } = openShop("/shop/hats?q=jean");
    expect(
      screen.getByRole("heading", { name: "No products match “jean”" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("There is 1 match in other categories."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Search all products" }));
    expect(url()).toHaveTextContent("/shop?q=jean");
    expect(names()).toEqual(["Black Jean Shearling"]);
  });

  it("clears a search with no results", async () => {
    const { user } = openShop("/shop?q=socks");
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(search()).toHaveValue("");
    expect(url()).toHaveTextContent(/^\/shop$/);
    expect(screen.getByText("3 products")).toBeInTheDocument();
  });

  it("shows placeholders while loading", () => {
    openShop("/shop", "loading");
    expect(screen.getByText("Loading products…")).toBeInTheDocument();
    expect(names()).toEqual([]);
  });

  it("offers a retry when products fail to load", async () => {
    firebaseUtilsMock.getProducts.mockResolvedValue([]);
    const { store, user } = openShop("/shop", "failed");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(firebaseUtilsMock.getProducts).toHaveBeenCalled();
    expect(store.getState().shop.status).toBe("succeeded");
  });

  it("shows Not Found for an unknown category", () => {
    openShop("/shop/socks");
    expect(
      screen.getByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument();
  });
});
