import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { Provider } from "react-redux";
import { persistor, store } from "./redux/store";
import { PersistGate } from "redux-persist/integration/react";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "./stripe/stripe.utils";

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <React.StrictMode>
      <PersistGate persistor={persistor}>
        <Elements
          stripe={stripePromise}
          options={{
            fonts: [
              {
                cssSrc:
                  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap",
              },
            ],
          }}
        >
          <App />
        </Elements>
      </PersistGate>
    </React.StrictMode>
  </Provider>,
);
