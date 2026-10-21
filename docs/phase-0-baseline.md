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
| Shop overview (`/shop`) | ✅ | — | Looked like Jackets showed "Blue Tanktop"; it was the overflowing row exposing the next section — data is correct |
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
2. ~~Shop overview Jackets preview contains a womens item~~ — not a bug: layout overflow showed the Womens row.
3. Leftover `console.log` calls in product details and collection code.

---

## Phase 1 re-check (Vite 8 + React 19) — 2026-10-21

Run with `npm install && npm run dev` on Node 22 (no Node 16 needed). `npm run build` ~1s, `npm test` runs Vitest.

| Flow | Result |
| --- | --- |
| Homepage tiles → collection page | ✅ same as baseline |
| Add to cart, dropdown, checkout quantity/remove/total | ✅ same as baseline |
| Cart survives a full reload (redux-persist) | ✅ |
| Product details via name link | ✅ same as baseline |
| Product details via direct URL | ❌ same pre-existing crash (not addressed in Phase 1) |
| Theme toggle, contact, sign-in page render, 404 | ✅ same as baseline |
| 375px layout | Same issues as baseline (scrollWidth 437 vs 375) — no regressions |
| Console | No React unknown-prop or deprecation warnings |
| Sign-in / sign-up / Google, Stripe payment | Not tested (production Firebase; no local Stripe key) |

Deploy note: rename the Netlify env var `REACT_APP_STRIPE_PUBLISHABLE_KEY` → `VITE_STRIPE_PUBLISHABLE_KEY`.

---

## Phase 2 re-check (RTK thunks, Firebase 11, React Router 7) — 2026-10-21

| Flow | Result |
| --- | --- |
| Product details via direct URL (`/shop/hats/2`) | ✅ **fixed** — renders after data loads |
| Unknown product / collection (`/shop/hats/999`, `/shop/socks`) | ✅ shows Not Found instead of crashing |
| Cart dropdown on first load | ✅ **fixed** — starts closed; open/closed is no longer persisted |
| Homepage tiles, collection title links (relative navigation) | ✅ |
| Shop overview, add to cart, checkout, cart persistence | ✅ |
| Sign-in page render | ✅ |
| Console | No errors or warnings |
| Bundle | Correction: the 259 kB figure was one chunk, with React split into another file — not a 3× saving. See the redesign section for the total. |
| Sign-in / sign-up / Google / sign-out, Stripe payment | Not tested (production Firebase; no local Stripe key) |

---

## Redesign (direction B, "clean retail") — 2026-10-21

All pages moved to Tailwind v4 with shared tokens (light/dark), Inter, and Lucide icons:
header + mobile menu, homepage, shop overview, collection pages, product cards, product page,
slide-out cart drawer, checkout, and sign-in/sign-up.

| Check | Result |
| --- | --- |
| 375px layout, every page | ✅ no horizontal scroll (baseline: 437–999px) |
| Light and dark themes, every page | ✅ |
| Total JS, all chunks | 713 kB raw / 227 kB gzip (Phase 1 main chunk alone was 767 / 233) |
| Tests | 11 passing (cart, shop, price format, auth error messages) |
| Fixed along the way | stuck Pay button, scroll position on navigation, silent sign-in errors, sign-up toast never shown, cart drawer state on Escape |
| Not tested locally | real sign-in/sign-up/Google (production Firebase), real Stripe payment |

Still on styled-components: Spinner, NotFound, ErrorBoundary, Contact page.
