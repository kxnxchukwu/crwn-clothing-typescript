# Phase 0 — Baseline (before modernization)

Recorded 2026-10-20 against commit `14d4b4e` (local) and https://shop.kenechukwu.dev/ (live).
Re-run this checklist after every modernization phase.

## How to run it today

`node-sass` 7 does not build on Node 22, so the current app only installs/runs on Node 16:

```bash
volta run --node 16 npm install
volta run --node 16 npm start
```

Local `.env` is missing `REACT_APP_STRIPE_PUBLISHABLE_KEY`, so the Stripe card field does not render locally
(console: `IntegrationError: Missing value for Stripe(): apiKey should be a string`). Firebase config is
hardcoded in `src/firebase/firebase.utils.ts`, so collections load from the live Firestore.

## Flow checklist

| Flow | Local | Live | Notes |
| --- | --- | --- | --- |
| Homepage category tiles → collection page | ✅ | ✅ | |
| Shop overview (`/shop`) | ✅ | — | Jackets preview shows "Blue Tanktop" (a womens item) |
| Collection page (`/shop/hats`) | ✅ | — | |
| Add to cart, cart badge count | ✅ | — | |
| Cart dropdown | ✅ | ⚠️ | Live: dropdown is open and overlays the page on load — latest commit not deployed yet? |
| Checkout: increase/decrease/remove, total | ✅ | — | |
| Checkout: Stripe card field / pay | ❌ (no key) | ✅ field renders | Payment not exercised |
| Product details via name link (`/shop/hats/1`) | ✅ | — | Only the name is a link, not the image; description is "Lorem ipsum" |
| Product details via direct URL / refresh | ❌ | ❌ | Crash: `Cannot destructure property 'items' of 'collections' as it is undefined` → error boundary |
| Theme toggle (dark/light) | ✅ | — | |
| Contact page | ✅ | — | "Under Construction" placeholder |
| Sign-in / sign-up page renders | ✅ | — | Sign-up column overflows right edge at ~800px width |
| Sign-in / sign-up / Google sign-in | not tested | not tested | Talks to production Firebase — test manually |
| 404 page | ✅ | — | |

## Responsive (375px phone width)

- Header: theme toggle overlaps the logo; "SIGN IN" wraps.
- Homepage: tile labels overlap each other.
- Collection grids are fixed-width columns and get clipped on the right (also at ~800px desktop width).
- Checkout: table headers collide; payment form overflows → page scrolls horizontally (scrollWidth 437 vs 375).

## Bugs to fix along the way

1. Product details crashes when loaded directly (`src/pages/productdetails/ProductDetails.component.tsx`):
   reads `collections.items` before the fetch finishes; also calls hooks after a conditional `throw`.
2. Shop overview Jackets preview contains a womens item (data or selector issue).
3. Leftover `console.log` calls in product details and collection code.
