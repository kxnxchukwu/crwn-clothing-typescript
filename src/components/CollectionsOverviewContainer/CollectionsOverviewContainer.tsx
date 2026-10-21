import { ReactElement } from "react";
import { useSelector } from "react-redux";
import { selectIsCollectionFetching } from "../../features/shop-slice";
import CollectionsOverview from "../CollectionsOverview/CollectionsOverview";
import { ProductGridSkeleton } from "../ProductGrid/ProductGrid";

export default function CollectionsOverviewContainer(): ReactElement {
  const isLoading: boolean = useSelector(selectIsCollectionFetching);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Shop
        </h1>
        <p className="mt-2 text-muted">
          Browse every collection, or pick one to see it all.
        </p>
      </header>
      {isLoading ? (
        <div className="space-y-16">
          <ProductGridSkeleton />
          <ProductGridSkeleton />
        </div>
      ) : (
        <CollectionsOverview />
      )}
    </div>
  );
}
