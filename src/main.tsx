import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { Provider } from "react-redux";
import { persistor, store } from "./redux/store";
import { PersistGate } from "redux-persist/integration/react";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "./stripe/stripe.utils";
import { StyleSheetManager } from "styled-components";
import isPropValid from "@emotion/is-prop-valid";

// styled-components v6 forwards every prop to the DOM; keep v5's behaviour of
// only passing valid HTML attributes to plain elements (e.g. not `imageUrl`).
const shouldForwardProp = (prop: string, target: unknown) =>
  typeof target === "string" ? isPropValid(prop) : true;

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <React.StrictMode>
      <PersistGate persistor={persistor}>
        <Elements stripe={stripePromise}>
          <StyleSheetManager shouldForwardProp={shouldForwardProp}>
            <App />
          </StyleSheetManager>
        </Elements>
      </PersistGate>
    </React.StrictMode>
  </Provider>
);
