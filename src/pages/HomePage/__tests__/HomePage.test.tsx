import { screen, within } from "@testing-library/react";
import HomePage from "../HomePage";
import CollectionsOverviewContainer from "../../../components/CollectionsOverviewContainer/CollectionsOverviewContainer";
import CollectionPageContainer from "../../../components/CollectionPageContainer/CollectionPageContainer";
import { renderWithProviders, shopState } from "../../../test/render";

vi.mock(
  "../../../firebase/firebase.utils",
  async () => (await import("../../../test/firebase-mock")).firebaseUtilsMock,
);

// Browsing: homepage → shop overview → a collection.
describe("browsing pages", () => {
  it("homepage links to every category and the shop", () => {
    renderWithProviders(<HomePage />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Everyday essentials, made to last",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Shop all" })).toHaveAttribute(
      "href",
      "/shop",
    );
    for (const category of ["hats", "jackets", "sneakers", "womens", "mens"]) {
      expect(
        screen.getByRole("link", { name: new RegExp(`^${category}\\b`, "i") }),
      ).toHaveAttribute("href", `/shop/${category}`);
    }
  });

  it("shop overview shows each collection with a View all link", () => {
    renderWithProviders(<CollectionsOverviewContainer />, {
      state: { shop: shopState() },
    });
    const hats = screen.getByRole("region", { name: "Hats" });
    expect(within(hats).getByText("Brown Brim")).toBeInTheDocument();
    expect(
      within(hats).getByRole("link", { name: "View all Hats" }),
    ).toHaveAttribute("href", "/shop/hats");
    expect(screen.getByRole("region", { name: "Jackets" })).toBeInTheDocument();
  });

  it("shop overview shows placeholders while loading", () => {
    renderWithProviders(<CollectionsOverviewContainer />, {
      state: { shop: shopState("loading") },
    });
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("collection page lists its products with a count", () => {
    renderWithProviders(<CollectionPageContainer />, {
      route: "/shop/hats",
      path: "/shop/:id",
      state: { shop: shopState() },
    });
    expect(
      screen.getByRole("heading", { level: 1, name: "Hats" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 products")).toBeInTheDocument();
    expect(screen.getByText("Blue Beanie")).toBeInTheDocument();
  });

  it("unknown collection shows Not Found", () => {
    renderWithProviders(<CollectionPageContainer />, {
      route: "/shop/socks",
      path: "/shop/:id",
      state: { shop: shopState() },
    });
    expect(
      screen.getByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument();
  });
});
