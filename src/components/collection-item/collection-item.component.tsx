import { ReactElement, useEffect, useState } from "react";
import { Link } from "react-router";
import { Check, Plus } from "lucide-react";
import { useAppDispatch } from "../../redux/hooks";
import { addItem, Item } from "../../features/cart-slice";
import { formatPrice } from "../../utils/format";

export interface CollectionItemProps {
  item: Item;
  title: string;
}

// Product card: the image and name link to the product page; "Add to cart"
// sits over the image (on hover/focus on desktop, always on touch screens).
export default function CollectionItem({
  item,
  title,
}: CollectionItemProps): ReactElement {
  const { name, price, imageUrl, id } = item;
  const dispatch = useAppDispatch();
  const [justAdded, setJustAdded] = useState(false);
  const productUrl = `/shop/${title.toLowerCase()}/${id}`;

  useEffect(() => {
    if (!justAdded) return;
    const timeout = setTimeout(() => setJustAdded(false), 1500);
    return () => clearTimeout(timeout);
  }, [justAdded]);

  const handleAdd = () => {
    dispatch(addItem({ item }));
    setJustAdded(true);
  };

  return (
    <div className="group">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-surface">
        <Link to={productUrl} tabIndex={-1} aria-hidden="true">
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </Link>
        <button
          type="button"
          onClick={handleAdd}
          aria-label={
            justAdded ? `${name} added to cart` : `Add ${name} to cart`
          }
          className="absolute right-2 bottom-2 inline-flex size-9 items-center justify-center gap-1.5 rounded-full bg-background/95 text-sm font-medium text-foreground shadow-sm backdrop-blur transition hover:bg-foreground hover:text-background md:left-2 md:h-10 md:w-auto md:translate-y-2 md:rounded-md md:opacity-0 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 md:group-hover:translate-y-0 md:group-hover:opacity-100"
        >
          {justAdded ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Plus className="size-4" aria-hidden="true" />
          )}
          <span className="hidden md:inline" aria-hidden="true">
            {justAdded ? "Added" : "Add to cart"}
          </span>
        </button>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3 text-sm">
        <Link
          to={productUrl}
          className="font-medium underline-offset-4 hover:underline"
        >
          {name}
        </Link>
        <span className="shrink-0 text-muted">{formatPrice(price)}</span>
      </div>
    </div>
  );
}
