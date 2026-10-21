import { ReactElement } from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router";
import { rootReducer, type RootState } from "../redux/root-reducer";
import type { Item } from "../features/cart-slice";

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

// Test data
export const hat: Item = {
  id: 1,
  name: "Brown Brim",
  imageUrl: "brim.png",
  price: 25,
  quantity: 1,
};
export const beanie: Item = {
  id: 2,
  name: "Blue Beanie",
  imageUrl: "beanie.png",
  price: 18,
  quantity: 1,
};
export const jacket: Item = {
  id: 18,
  name: "Black Jean Shearling",
  imageUrl: "jacket.png",
  price: 125,
  quantity: 1,
};

export const shopState = (
  status: "idle" | "loading" | "succeeded" | "failed" = "succeeded",
): RootState["shop"] => ({
  status,
  errorMessage: undefined,
  collections: {
    hats: {
      id: "c1",
      title: "Hats",
      routeName: "hats",
      items: [
        { ...hat, quantity: 0 },
        { ...beanie, quantity: 0 },
      ],
    },
    jackets: {
      id: "c2",
      title: "Jackets",
      routeName: "jackets",
      items: [{ ...jacket, quantity: 0 }],
    },
  },
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
