# Order saving: setup

Orders are written only by the Netlify functions, never by the browser:

1. `create-payment-intent` prices the cart from Firestore, creates the Stripe
   PaymentIntent, and writes `orders/{paymentIntentId}` with status `pending`
   (items snapshot, total in cents, and the user's id if they're signed in —
   verified from their Firebase ID token).
2. Stripe calls `stripe-webhook` when the payment settles. It verifies Stripe's
   signature and sets the order to `paid` (or `failed`). Repeated events are safe.
3. `/orders` shows the signed-in user's paid orders, live from Firestore.

Without the variables below, payments still work; orders just aren't saved.

## 1. Firebase service account

Firebase console → Project settings → Service accounts → **Generate new private key**.
From the downloaded JSON, set these in Netlify (Site configuration → Environment
variables), and in `.env.local` for `netlify dev`:

- `FIREBASE_CLIENT_EMAIL` — the `client_email` value
- `FIREBASE_PRIVATE_KEY` — the `private_key` value, exactly as in the JSON
  (one line with `\n` sequences is fine)

Keep the JSON file out of the repo and delete it once the values are stored.

## 2. Stripe webhook

Stripe dashboard (test mode) → Developers → Webhooks → **Add endpoint**:

- URL: `https://<your-site>/.netlify/functions/stripe-webhook`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

Copy the signing secret into `STRIPE_WEBHOOK_SECRET`. Deploy previews have
their own URL, so add a second endpoint (or use the Stripe CLI) to test them.

Locally, with the [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

It prints a `whsec_…` secret to use as `STRIPE_WEBHOOK_SECRET` while it runs.

## 3. Firestore rules

Compare `firestore.rules` with your current rules in the console, then deploy:

```bash
npx firebase-tools deploy --only firestore:rules --project crwn-clothing-db-c479f
```

The important parts: product `collections` are read-only, and users can read
only their own `orders`.
