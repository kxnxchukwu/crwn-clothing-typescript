import { ReactElement } from "react";
import Button from "../../components/button/button.component";
import "./productdetails.styles.scss";
import { useParams } from "react-router";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../redux/hooks";
import {
  selectCollection,
  selectIsCollectionFetching,
} from "../../features/shop-slice";
import { addItem } from "../../features/cart-slice";
import Spinner from "../../components/spinner/spinner.component";
import NotFound from "../../components/notfound/notfound.component";

export default function ProductDetailsPage(): ReactElement {
  const dispatch = useAppDispatch();
  const { id = "", productId = "" } = useParams();
  const isFetching = useSelector(selectIsCollectionFetching);
  const collection = useSelector(selectCollection(id.toLowerCase()));
  const item = collection?.items.find((item) => item.id === Number(productId));

  if (isFetching) {
    return <Spinner />;
  }

  if (!item) {
    return <NotFound />;
  }

  return (
    <div className="product-details-container">
      <div className="col-8">
        <img src={item.imageUrl} alt={item.name} />
      </div>
      <div className="col-4">
        <div>
          <div>
            <p>New Season</p>
            <h1>
              {item.name}
              <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>
            </h1>
          </div>
          <div>
            <p>€{item.price}</p>
            <p>VAT included</p>
          </div>
          <div>
            <Button
              onClick={() => dispatch(addItem({ item }))}
              buttonType="base"
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
