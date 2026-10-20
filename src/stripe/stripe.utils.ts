import { loadStripe } from "@stripe/stripe-js";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Without a key (e.g. local dev with no .env) render Elements with no Stripe
// instance instead of throwing on every page load.
export const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
