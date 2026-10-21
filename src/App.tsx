import { Suspense, useEffect, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router";
import { Toaster } from "sonner";
import Header from "./components/Header/Header";
import { useSelector } from "react-redux";
import { useAppDispatch } from "./redux/hooks";
import { selectCurrentUser, checkUserSession } from "./features/user-slice";
import Spinner from "./components/Spinner/Spinner";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";
import { fetchCollections } from "./features/shop-slice";
import NotFound from "./components/NotFound/NotFound";
import { selectTheme } from "./features/theme-slice";
import ProductDetailsPage from "./pages/ProductDetailsPage/ProductDetailsPage";

const HomePage = lazy(() => import("./pages/HomePage/HomePage"));
const SignInAndSignUpPage = lazy(
  () => import("./pages/SignInAndSignUpPage/SignInAndSignUpPage"),
);
const CheckoutPage = lazy(() => import("./pages/CheckoutPage/CheckoutPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage/OrdersPage"));
const CollectionsOverviewContainer = lazy(
  () =>
    import("./components/CollectionsOverviewContainer/CollectionsOverviewContainer"),
);
const CollectionPageContainer = lazy(
  () => import("./components/CollectionPageContainer/CollectionPageContainer"),
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
                    <Route path=":productId" element={<ProductDetailsPage />} />
                  </Route>
                </Route>
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route
                  path="/signin"
                  element={
                    currentUser ? <Navigate to="/" /> : <SignInAndSignUpPage />
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
        </>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default App;
