import { ReactElement } from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router";
import { rootReducer, type RootState } from "../redux/root-reducer";
import type { Item } from "../features/cart-slice";
import type { Product } from "../catalogue/product";

export const makeStore = (preloadedState?: Partial<RootState>) =>
  configureStore({ reducer: rootReducer, preloadedState });

export type TestStore = ReturnType<typeof makeStore>;

interface Options {
  state?: Partial<RootState>;
  // The URL to start at, and the route pattern the element is mounted on
  // (needed for components that read useParams). Defaults to the URL's path,
  // so navigating elsewhere renders "Navigated away".
  route?: string;
  path?: string;
}

// Render with a fresh Redux store and an in-memory router. Returns the store
// so tests can assert on state, plus a userEvent instance.
export function renderWithProviders(
  ui: ReactElement,
  { state, route = "/", path = route.split("?")[0] }: Options = {},
) {
  const store = makeStore(state);
  const user = userEvent.setup();
  const result = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={ui} />
          <Route path="*" element={<p>Navigated away</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return { store, user, ...result };
}

// Test data: catalogue products, and the same products as cart lines.
export const hatProduct: Product = {
  id: 1,
  name: "Brown Brim",
  category: "hats",
  imageUrl: "brim.png",
  price: 25,
  description: "A wide-brimmed hat in warm brown.",
};
export const beanieProduct: Product = {
  id: 2,
  name: "Blue Beanie",
  category: "hats",
  imageUrl: "beanie.png",
  price: 18,
  description: "A snug knit beanie in bright blue.",
};
export const jacketProduct: Product = {
  id: 18,
  name: "Black Jean Shearling",
  category: "jackets",
  imageUrl: "jacket.png",
  price: 125,
  description: "A black denim jacket with a warm collar.",
};

const asLine = ({ id, name, imageUrl, price }: Product): Item => ({
  id,
  name,
  imageUrl,
  price,
  quantity: 1,
});
export const hat = asLine(hatProduct);
export const beanie = asLine(beanieProduct);
export const jacket = asLine(jacketProduct);

export const shopState = (
  status: "idle" | "loading" | "succeeded" | "failed" = "succeeded",
): RootState["shop"] => ({
  status,
  errorMessage: undefined,
  products: [hatProduct, beanieProduct, jacketProduct],
});

export const signedInUser: RootState["user"] = {
  currentUser: {
    id: "user-1",
    displayName: "Ada Lovelace",
    email: "ada@example.test",
    createdAt: null,
  },
  error: null,
  sessionChecked: true,
};
