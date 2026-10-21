import { ReactElement } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import CollectionItem from "../CollectionItem/CollectionItem";
import { ProductGrid } from "../ProductGrid/ProductGrid";
import { Item } from "../../features/cart-slice";

export interface CollectionPreviewProps {
  title: string;
  items: Item[];
}

export default function CollectionPreview({
  title,
  items,
}: CollectionPreviewProps): ReactElement {
  const headingId = `collection-${title.toLowerCase()}`;

  return (
    <section aria-labelledby={headingId}>
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h2 id={headingId} className="text-xl font-semibold tracking-tight">
          {title}
        </h2>
        <Link
          to={`/shop/${title.toLowerCase()}`}
          className="group flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
        >
          View all
          <span className="sr-only"> {title}</span>
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>
      <ProductGrid>
        {items.slice(0, 4).map((item) => (
          <CollectionItem key={item.id} item={item} title={title} />
        ))}
      </ProductGrid>
    </section>
  );
}
