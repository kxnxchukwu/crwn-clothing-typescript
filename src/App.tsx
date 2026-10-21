import { Suspense, useEffect, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router";
import { ThemeProvider } from "styled-components";
import { Toaster } from "sonner";
import Header from "./components/header/header.component";
import { useSelector } from "react-redux";
import { useAppDispatch } from "./redux/hooks";
import { selectCurrentUser, checkUserSession } from "./features/user-slice";
import Spinner from "./components/spinner/spinner.component";
import ErrorBoundary from "./components/error-boundary/error-boundary.component";
import { lightTheme, darkTheme } from "./themes";
import { fetchCollections } from "./features/shop-slice";
import NotFound from "./components/notfound/notfound.component";
import { selectTheme } from "./features/theme-slice";
import ProductDetailsPage from "./pages/productdetails/ProductDetails.component";

const HomePage = lazy(() => import("./pages/homepage/homepage.component"));
const SignInAndSignUpPage = lazy(
  () => import("./pages/sign-in-and-sign-up/sign-in-and-sign-up.component"),
);
const CheckoutPage = lazy(() => import("./pages/checkout/checkout.component"));
const OrdersPage = lazy(() => import("./pages/orders/orders.component"));
const CollectionsOverviewContainer = lazy(
  () =>
    import("./components/collections-overview/collections-overview-container"),
);
const CollectionPageContainer = lazy(
  () => import("./components/collection/collection.container"),
);

// Start each new page at the top instead of keeping the previous scroll position.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const App = () => {
  const currentUser = useSelector(selectCurrentUser);
  const theme = useSelector(selectTheme);
  const dispatch = useAppDispatch();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    dispatch(checkUserSession());
    dispatch(fetchCollections());
  }, [dispatch]);
  return (
    <ThemeProvider theme={theme === "light" ? lightTheme : darkTheme}>
      <BrowserRouter>
        <ErrorBoundary>
          <>
            <ScrollToTop />
            <Toaster
              theme={theme === "dark" ? "dark" : "light"}
              position="bottom-right"
              closeButton
              toastOptions={{
                style: {
                  fontFamily: "inherit",
                  background: "var(--background)",
                  color: "var(--foreground)",
                  borderColor: "var(--line)",
                },
              }}
            />
            <Header />
            <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <Suspense fallback={<Spinner />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/shop">
                    <Route index element={<CollectionsOverviewContainer />} />
                    <Route path="/shop/:id">
                      <Route index element={<CollectionPageContainer />} />
                      <Route
                        path=":productId"
                        element={<ProductDetailsPage />}
                      />
                    </Route>
                  </Route>
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route
                    path="/signin"
                    element={
                      currentUser ? (
                        <Navigate to="/" />
                      ) : (
                        <SignInAndSignUpPage />
                      )
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
          </>
        </ErrorBoundary>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
