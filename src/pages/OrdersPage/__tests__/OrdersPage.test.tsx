import { screen } from "@testing-library/react";
import OrdersPage from "../OrdersPage";
import { renderWithProviders, signedInUser } from "../../../test/render";
import { useOrders } from "../../../features/use-orders";

vi.mock(
  "../../../firebase/firebase.utils",
  async () => (await import("../../../test/firebase-mock")).firebaseUtilsMock,
);
vi.mock("../../../features/use-orders", () => ({ useOrders: vi.fn() }));

const ordersHook = vi.mocked(useOrders);

const renderOrders = (user = signedInUser) =>
  renderWithProviders(<OrdersPage />, { route: "/orders", state: { user } });

describe("OrdersPage", () => {
  beforeEach(() => ordersHook.mockReturnValue({ status: "loading" }));

  it("sends signed-out visitors to sign in", () => {
    renderOrders({ currentUser: null, error: null, sessionChecked: true });
    expect(screen.getByText("Navigated away")).toBeInTheDocument();
  });

  it("waits for the session check instead of redirecting", () => {
    renderOrders({ currentUser: null, error: null, sessionChecked: false });
    expect(
      screen.getByRole("heading", { name: "Your orders" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Navigated away")).not.toBeInTheDocument();
  });

  it("asks for the signed-in user's orders", () => {
    renderOrders();
    expect(ordersHook).toHaveBeenCalledWith("user-1");
  });

  it("explains when orders can't be loaded", () => {
    ordersHook.mockReturnValue({ status: "error" });
    renderOrders();
    expect(
      screen.getByText(/We couldn't load your orders right now/),
    ).toBeInTheDocument();
  });

  it("shows an empty state", () => {
    ordersHook.mockReturnValue({ status: "ready", orders: [] });
    renderOrders();
    expect(screen.getByText("No orders yet")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start shopping" }),
    ).toHaveAttribute("href", "/shop");
  });

  it("lists orders with date, total, item count and lines", () => {
    ordersHook.mockReturnValue({
      status: "ready",
      orders: [
        {
          id: "pi_3USoG5CGRVU8CKHq10d2Ffte",
          total: 42300,
          createdAt: new Date("2026-10-21T01:24:01Z"),
          items: [
            {
              id: 2,
              name: "Blue Beanie",
              imageUrl: "b.png",
              price: 18,
              quantity: 1,
            },
            {
              id: 18,
              name: "Black Jean Shearling",
              imageUrl: "j.png",
              price: 125,
              quantity: 2,
            },
          ],
        },
      ],
    });
    renderOrders();

    expect(screen.getByText("21 Oct 2026")).toBeInTheDocument();
    expect(screen.getByText("€423")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("#10D2FFTE")).toBeInTheDocument();
    expect(screen.getByText("2 × €125")).toBeInTheDocument();
    expect(screen.getByText("€250")).toBeInTheDocument();
  });
});
