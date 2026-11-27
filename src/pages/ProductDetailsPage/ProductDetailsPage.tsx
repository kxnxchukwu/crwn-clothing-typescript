import { ReactElement, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { useSelector } from "react-redux";
import { ChevronRight, Minus, Plus } from "lucide-react";
import { useAppDispatch } from "../../redux/hooks";
import {
  selectCollection,
  selectIsCollectionFetching,
} from "../../features/shop-slice";
import { addItem, selectQuantityInCart } from "../../features/cart-slice";
import {
  isOneSize,
  isSoldOut,
  LOW_STOCK,
  stockOf,
  type Product,
} from "../../catalogue/product";
import NotFound from "../../components/NotFound/NotFound";
import CollectionItem from "../../components/CollectionItem/CollectionItem";
import { ProductGrid } from "../../components/ProductGrid/ProductGrid";
import { formatPrice } from "../../utils/format";
import { toastAddedToCart } from "../../utils/cart-toast";

const MAX_QUANTITY = 10;

export default function ProductDetailsPage(): ReactElement {
  const dispatch = useAppDispatch();
  const { id = "", productId = "" } = useParams();
  const isFetching = useSelector(selectIsCollectionFetching);
  const collection = useSelector(selectCollection(id.toLowerCase()));
  const item = collection?.items.find((item) => item.id === Number(productId));
  // Size and quantity belong to the product they were picked for, so moving
  // to another product (e.g. via "More from") starts again.
  const [picked, setPicked] = useState<{
    productId: string;
    size: string | null;
    quantity: number;
  }>({ productId, size: null, quantity: 1 });
  const current =
    picked.productId === productId
      ? picked
      : { productId, size: null, quantity: 1 };
  // One-size products need no choice.
  const size =
    item && isOneSize(item) ? item.sizes[0] : (current.size ?? undefined);
  const inCart = useSelector(selectQuantityInCart(item?.id ?? 0, size));
  // What can still be added: stock for the size, less what's in the cart.
  const available =
    item && size ? Math.max(0, stockOf(item, size) - inCart) : 0;
  const maxQuantity = Math.min(MAX_QUANTITY, available);
  const quantity = Math.max(1, Math.min(current.quantity, maxQuantity));
  // Update from the latest stored value so quick repeated clicks all count.
  const setQuantity = (update: (current: number) => number) =>
    setPicked((prev) => {
      const base =
        prev.productId === productId
          ? prev
          : { productId, size: null, quantity: 1 };
      return {
        ...base,
        quantity: update(Math.min(base.quantity, maxQuantity)),
      };
    });
  const pickSize = (next: string) =>
    setPicked({ productId, size: next, quantity: 1 });

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

  const soldOut = isSoldOut(item);
  const canAdd = !!size && available > 0;

  const handleAdd = () => {
    if (!size || !canAdd) return;
    dispatch(addItem({ item, size, quantity }));
    toastAddedToCart(
      dispatch,
      isOneSize(item) ? item.name : `${item.name} (${size})`,
      quantity,
    );
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
            <p className="mt-6 leading-relaxed text-pretty">
              {item.description}
            </p>

            {!isOneSize(item) && (
              <SizePicker
                product={item}
                selected={current.size}
                onSelect={pickSize}
              />
            )}

            <p
              className="mt-4 min-h-5 text-sm"
              aria-live="polite"
              data-testid="stock-status"
            >
              {stockMessage(item, size, inCart)}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <div
                className="inline-flex h-11 items-center rounded-md border border-line"
                role="group"
                aria-label="Quantity"
              >
                <button
                  type="button"
                  className="inline-flex size-11 items-center justify-center text-muted transition-colors hover:text-foreground disabled:opacity-40"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={!canAdd || quantity <= 1}
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
                    setQuantity((q) => Math.min(maxQuantity, q + 1))
                  }
                  disabled={!canAdd || quantity >= maxQuantity}
                  aria-label="Increase quantity"
                >
                  <Plus className="size-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={!canAdd}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {soldOut ? "Sold out" : size ? "Add to cart" : "Select a size"}
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
              <CollectionItem key={other.id} item={other} />
            ))}
          </ProductGrid>
        </section>
      )}
    </div>
  );
}

// What the shopper needs to know before adding: pick a size, how many are
// left, or why they can't add more.
function stockMessage(
  product: Product,
  size: string | undefined,
  inCart: number,
): string {
  if (isSoldOut(product)) return "Sold out in every size.";
  if (!size) return "Select a size.";
  const stock = stockOf(product, size);
  const label = isOneSize(product) ? "" : ` in ${size}`;
  if (stock === 0) return `Sold out${label}.`;
  if (inCart >= stock) {
    return stock === 1
      ? `The last one${label} is in your cart.`
      : `All ${stock}${label} are in your cart.`;
  }
  if (stock <= LOW_STOCK) return `Only ${stock} left${label}.`;
  return "In stock.";
}

function SizePicker({
  product,
  selected,
  onSelect,
}: {
  product: Product;
  selected: string | null;
  onSelect: (size: string) => void;
}): ReactElement {
  return (
    <fieldset className="mt-8">
      <legend className="mb-3 text-sm font-medium">Size</legend>
      <div className="flex flex-wrap gap-2">
        {product.sizes.map((size) => {
          const soldOut = stockOf(product, size) === 0;
          // "EU 40" has a space, which an id can't.
          const noteId = `size-${size.replace(/\s+/g, "-")}-note`;
          return (
            <div key={size}>
              <label className="relative">
                <input
                  type="radio"
                  name="size"
                  value={size}
                  checked={selected === size}
                  onChange={() => onSelect(size)}
                  disabled={soldOut}
                  aria-describedby={soldOut ? noteId : undefined}
                  className="peer sr-only"
                />
                <span className="inline-flex h-10 min-w-12 cursor-pointer items-center justify-center rounded-md border border-line px-3 text-sm transition-colors peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-foreground peer-disabled:cursor-not-allowed peer-disabled:text-muted peer-disabled:line-through hover:border-foreground peer-disabled:hover:border-line">
                  {size}
                </span>
              </label>
              {soldOut && (
                <span id={noteId} className="sr-only">
                  Sold out
                </span>
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
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
