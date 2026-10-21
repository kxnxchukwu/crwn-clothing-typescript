import { ReactElement } from "react";
import { Link, useParams } from "react-router";
import { ChevronRight } from "lucide-react";
import { useSelector } from "react-redux";
import CollectionItem from "../CollectionItem/CollectionItem";
import {
  ProductGrid,
  ProductGridSkeleton,
} from "../ProductGrid/ProductGrid";
import NotFound from "../NotFound/NotFound";
import {
  selectCollection,
  selectIsCollectionFetching,
} from "../../features/shop-slice";

export default function CollectionPageContainer(): ReactElement {
  const { id = "" } = useParams();

  const isFetching = useSelector(selectIsCollectionFetching);
  const collection = useSelector(selectCollection(id));

  if (!isFetching && !collection) {
    return <NotFound />;
  }

  return (
    <div className="space-y-8">
      <header>
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link to="/shop" className="hover:text-foreground">
                Shop
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-3.5" />
            </li>
            <li aria-current="page" className="text-foreground capitalize">
              {collection?.title ?? id}
            </li>
          </ol>
        </nav>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight capitalize sm:text-4xl">
          {collection?.title ?? id}
        </h1>
        {collection && (
          <p className="mt-2 text-sm text-muted">
            {collection.items.length}{" "}
            {collection.items.length === 1 ? "product" : "products"}
          </p>
        )}
      </header>

      {collection ? (
        <ProductGrid>
          {collection.items.map((item) => (
            <CollectionItem
              key={item.id}
              item={item}
              title={collection.title}
            />
          ))}
        </ProductGrid>
      ) : (
        <ProductGridSkeleton count={8} />
      )}
    </div>
  );
}
