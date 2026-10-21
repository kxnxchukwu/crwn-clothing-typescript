import { ReactElement } from "react";
import { useSelector } from "react-redux";
import CollectionPreview from "../CollectionPreview/CollectionPreview";
import { selectCollectionsForPreview } from "../../features/shop-slice";

export default function CollectionsOverview(): ReactElement {
  const collections = useSelector(selectCollectionsForPreview);
  return (
    <div className="space-y-16">
      {collections.map(({ id, ...otherCollectionProps }) => (
        <CollectionPreview key={id} {...otherCollectionProps} />
      ))}
    </div>
  );
}
