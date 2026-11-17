import { screen } from "@testing-library/react";
import HomePage from "../HomePage";
import { renderWithProviders } from "../../../test/render";

vi.mock(
  "../../../firebase/firebase.utils",
  async () => (await import("../../../test/firebase-mock")).firebaseUtilsMock,
);

describe("HomePage", () => {
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
});
