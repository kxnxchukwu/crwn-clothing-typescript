import { ReactElement } from "react";
import "./collection.styles.scss";
import CollectionItem from "../collection-item/collection-item.component";
import { useSelector } from "react-redux";
import {
  selectCollection,
  selectIsCollectionFetching,
} from "../../features/shop-slice";
import { useParams } from "react-router";
import { Item } from "../../features/cart-slice";
import Spinner from "../spinner/spinner.component";
import NotFound from "../notfound/notfound.component";

export default function CollectionPageContainer(): ReactElement {
  const { id = "" } = useParams();

  const isFetching = useSelector(selectIsCollectionFetching);

  const collection = useSelector(selectCollection(id));
  if (isFetching) {
    return <Spinner />;
  }

  if (!collection) {
    return <NotFound />;
  }

  const { title, items } = collection;
  return (
    <div className="collection-page">
      <h2 className="title">{title.toUpperCase()}</h2>
      <div className="items">
        {items.map((item: Item) => (
          <CollectionItem key={item.id} item={item} title={title} />
        ))}
      </div>
    </div>
  );
}
