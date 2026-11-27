import { loadStripe } from "@stripe/stripe-js";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Only the checkout pages import this, so Stripe.js loads there and not on
// every page. Without a key (e.g. local dev with no .env) it's null and the
// checkout explains that payments aren't set up.
export const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
