import { ReactElement } from "react";
import { Link, Navigate } from "react-router";
import { useSelector } from "react-redux";
import { Package } from "lucide-react";
import {
  selectCurrentUser,
  selectIsSessionChecked,
} from "../../features/user-slice";
import { Order, useOrders } from "../../features/use-orders";
import { formatPrice } from "../../utils/format";

const dateFormat = new Intl.DateTimeFormat("en-IE", { dateStyle: "medium" });

export default function OrdersPage(): ReactElement {
  const currentUser = useSelector(selectCurrentUser);
  const sessionChecked = useSelector(selectIsSessionChecked);
  const orders = useOrders(currentUser?.id);

  if (sessionChecked && !currentUser) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Your orders
      </h1>

      <div className="mt-8">
        {!currentUser || orders.status === "loading" ? (
          <OrdersSkeleton />
        ) : orders.status === "error" ? (
          <p className="rounded-md border border-line p-4 text-sm text-muted">
            We couldn't load your orders right now. Please try again later.
          </p>
        ) : orders.orders.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Package className="size-12 text-muted" aria-hidden="true" />
            <p className="mt-4 font-medium">No orders yet</p>
            <p className="mt-1 text-sm text-muted">
              When you buy something, it'll show up here.
            </p>
            <Link
              to="/shop"
              className="mt-6 inline-flex h-11 items-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="space-y-6">
            {orders.orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }): ReactElement {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <li className="overflow-hidden rounded-lg border border-line">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-surface px-5 py-4 text-sm">
        <dl className="flex flex-wrap gap-x-8 gap-y-2">
          <div>
            <dt className="text-muted">Order placed</dt>
            <dd className="font-medium">
              {order.createdAt ? dateFormat.format(order.createdAt) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Total</dt>
            <dd className="font-medium">{formatPrice(order.total / 100)}</dd>
          </div>
          <div>
            <dt className="text-muted">Items</dt>
            <dd className="font-medium">{itemCount}</dd>
          </div>
        </dl>
        <p className="text-muted">
          Order{" "}
          <span className="font-mono text-foreground">
            #{order.id.slice(-8).toUpperCase()}
          </span>
        </p>
      </div>
      <ul className="divide-y divide-line px-5">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 py-4">
            <div className="h-20 w-16 shrink-0 overflow-hidden rounded-md bg-surface">
              <img
                src={item.imageUrl}
                alt=""
                loading="lazy"
                className="size-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p className="mt-0.5 text-sm text-muted">
                {item.quantity} × {formatPrice(item.price)}
              </p>
            </div>
            <p className="text-sm font-medium tabular-nums">
              {formatPrice(item.price * item.quantity)}
            </p>
          </li>
        ))}
      </ul>
    </li>
  );
}

function OrdersSkeleton(): ReactElement {
  return (
    <div className="animate-pulse space-y-6" aria-hidden="true">
      {[0, 1].map((key) => (
        <div key={key} className="rounded-lg border border-line">
          <div className="h-16 bg-surface" />
          <div className="flex gap-4 p-5">
            <div className="h-20 w-16 rounded-md bg-surface" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 w-1/2 rounded bg-surface" />
              <div className="h-4 w-1/4 rounded bg-surface" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
