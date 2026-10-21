import { ReactElement, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { useSelector } from "react-redux";
import { ChevronRight, Minus, Plus } from "lucide-react";
import { useAppDispatch } from "../../redux/hooks";
import {
  selectCollection,
  selectIsCollectionFetching,
} from "../../features/shop-slice";
import { addItem } from "../../features/cart-slice";
import NotFound from "../../components/notfound/notfound.component";
import CollectionItem from "../../components/collection-item/collection-item.component";
import { ProductGrid } from "../../components/product-grid/product-grid.component";
import { formatPrice } from "../../utils/format";
import { toastAddedToCart } from "../../utils/cart-toast";

const MAX_QUANTITY = 10;

export default function ProductDetailsPage(): ReactElement {
  const dispatch = useAppDispatch();
  const { id = "", productId = "" } = useParams();
  const isFetching = useSelector(selectIsCollectionFetching);
  const collection = useSelector(selectCollection(id.toLowerCase()));
  const item = collection?.items.find((item) => item.id === Number(productId));
  const [quantity, setQuantity] = useState(1);

  // Reset when moving between products (e.g. via "More from").
  useEffect(() => {
    setQuantity(1);
  }, [productId]);

  useEffect(() => {
    if (!item) return;
    document.title = `${item.name} — CRWN Clothing`;
    return () => {
      document.title = "CRWN Clothing";
    };
  }, [item]);

  if (isFetching) {
    return <ProductDetailsSkeleton />;
  }

  if (!item || !collection) {
    return <NotFound />;
  }

  const handleAdd = () => {
    for (let i = 0; i < quantity; i++) {
      dispatch(addItem({ item }));
    }
    toastAddedToCart(dispatch, item.name, quantity);
  };

  const related = collection.items
    .filter((other) => other.id !== item.id)
    .slice(0, 4);

  return (
    <div className="space-y-16">
      <div>
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/shop" className="hover:text-foreground">
                Shop
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-3.5" />
            </li>
            <li>
              <Link
                to={`/shop/${collection.title.toLowerCase()}`}
                className="hover:text-foreground"
              >
                {collection.title}
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-3.5" />
            </li>
            <li aria-current="page" className="text-foreground">
              {item.name}
            </li>
          </ol>
        </nav>

        <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
          {/* Source photos are ~300px wide, so cap the size to keep them sharp. */}
          <div className="mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-lg bg-surface md:mx-0 md:justify-self-end">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="size-full object-cover"
            />
          </div>

          <div className="md:max-w-sm md:pt-4">
            <h1 className="text-3xl font-semibold tracking-tight">
              {item.name}
            </h1>
            <p className="mt-3 text-xl">{formatPrice(item.price)}</p>
            <p className="mt-1 text-sm text-muted">VAT included</p>
            <p className="mt-6 text-sm text-muted">
              From the{" "}
              <Link
                to={`/shop/${collection.title.toLowerCase()}`}
                className="text-foreground underline underline-offset-4"
              >
                {collection.title}
              </Link>{" "}
              collection.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <div
                className="inline-flex h-11 items-center rounded-md border border-line"
                role="group"
                aria-label="Quantity"
              >
                <button
                  type="button"
                  className="inline-flex size-11 items-center justify-center text-muted transition-colors hover:text-foreground disabled:opacity-40"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-4" />
                </button>
                <span
                  className="w-8 text-center text-sm tabular-nums"
                  aria-live="polite"
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  className="inline-flex size-11 items-center justify-center text-muted transition-colors hover:text-foreground disabled:opacity-40"
                  onClick={() =>
                    setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))
                  }
                  disabled={quantity >= MAX_QUANTITY}
                  aria-label="Increase quantity"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Add to cart
              </button>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading">
          <h2
            id="related-heading"
            className="mb-6 text-xl font-semibold tracking-tight"
          >
            More from {collection.title}
          </h2>
          <ProductGrid>
            {related.map((other) => (
              <CollectionItem
                key={other.id}
                item={other}
                title={collection.title}
              />
            ))}
          </ProductGrid>
        </section>
      )}
    </div>
  );
}

function ProductDetailsSkeleton(): ReactElement {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="h-4 w-48 rounded bg-surface" />
      <div className="mt-6 grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
        <div className="mx-auto aspect-[4/5] w-full max-w-md rounded-lg bg-surface md:mx-0 md:justify-self-end" />
        <div className="space-y-4 md:max-w-sm md:pt-4">
          <div className="h-8 w-2/3 rounded bg-surface" />
          <div className="h-6 w-20 rounded bg-surface" />
          <div className="mt-8 h-11 rounded bg-surface" />
        </div>
      </div>
    </div>
  );
}
