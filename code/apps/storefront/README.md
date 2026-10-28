# Storefront

A small dark-themed React app for browsing products, registering and signing in as a
customer, and placing an order - built to be projected on a screen at a conference while someone
narrates the business process out loud, right before an Event Storming session. It talks
to the three real backend services in this repo. Nothing is mocked and nothing is
invented: every screen only shows what `GET /products`, `GET /orders`, `POST /orders`,
and the `customer-service` `/customers` endpoints actually return.

Design details (palette, type scale, layout, how business state is shown) follow
`../../DESIGN.md` section 4.

## Starting everything, in order, for someone on a stage

Four processes, each in its own terminal. Run them in this order - each service after
the first depends on the one(s) before it being reachable.

**1. Products service** (from the repo root):

```bash
cd services/products-service
npm install   # first time only
npm run dev
```

Runs at `http://localhost:3001`.

**2. Customer service** (from the repo root, needs the .NET 10 SDK):

```bash
cd services/customer-service
dotnet run --urls http://localhost:3003
```

Runs at `http://localhost:3003`. Its data is in-memory and resets every time you
restart it - seeded customers `customer-1` (John Doe) and `customer-2` (Jane Smith) both
carry loyalty/bulk discounts, which is the fastest way to local the discount feature
without registering a new customer first.

**3. Orders service** (from the repo root):

```bash
cd services/orders-service
npm install   # first time only
npm run dev
```

Runs at `http://localhost:3002`. It calls products-service and customer-service
internally when you place an order - both must already be up.

**4. Storefront** (this directory):

```bash
cd apps/storefront
npm install   # first time only
npm run dev
```

Runs at `http://localhost:3010`. Open that in the browser you're projecting.

If a service isn't running, the storefront doesn't crash or hang - it shows a plain
"Service unavailable" panel with a retry button on whichever page needed that service.
That's a safe state to local in if something didn't start in time.

### Before you go on stage

This app loads its UI font (Inter, JetBrains Mono) from Google Fonts. If the venue's
network can't reach `fonts.googleapis.com`, the page still renders instantly with the
system font fallback - it never blocks on the font request - but test the venue's wifi
beforehand if you want the exact typeface. Nothing else in the app needs the internet;
all data comes from the three services above.

## The flow this app covers

1. **Browse** (`/`) - every active product from `GET /products`, as a card grid.
2. **Product detail** (`/products/:id`) - full detail from `GET /products/:id`: price,
   stock, SKU, weight, dimensions.
3. **Register** (`/register`) - self-service sign-up: a full name, a login and a
   password (`POST /customers`), followed immediately by a sign-in so a new customer
   walks the same path a returning one does. The login is the email address.
   **Sign in** (`/sign-in`) - `POST /customers/sign-in` exchanges the login and the
   password for a session token (see "How signing in works" below).
4. **Place an order** - from a product page, pick a quantity and place a single-item
   order (`POST /orders`). No cart exists in the API, so the app doesn't pretend to have
   one - a "buy this now" button is the honest shape of what's actually available.
5. **Order confirmation** (`/orders/:id`) - the created order, itemized, with a status
   stepper and whatever unit price the orders/products/customer services actually agreed
   on (discounts included).
6. **Order history** (`/orders`) - `GET /orders?customerId=...`, newest first.
7. **Account** (`/account`) - the signed-in customer's own details (editable via
   `PUT /customers/:id`) and their discounts (`GET /customers/:id/discounts`).

## How signing in works

`POST /customers/sign-in` takes a login and a password and returns an opaque session
token plus the customer it belongs to. The browser keeps the token in `localStorage`
under `storefront.sessionToken` and nothing else; on every load the token is exchanged
for the customer again at `GET /customers/session`, so a revoked or forgotten token
resolves to nobody. Signing out revokes it at `DELETE /customers/session`.

`/account`, `/orders` and `/orders/:id` are closed to a visitor who is not signed in -
they redirect to `/sign-in`. A refused sign-in says "Login or password is incorrect" and
never which half was wrong, because that is the one message `customer-service` returns
for both cases.

What this deliberately is not: not a JWT, not persistent (restarting
`customer-service` signs everybody out), not expiring, and not authorization - only the
session endpoints check the token, every other endpoint on the service is open.
`services/customer-service/Services/SessionStore.cs` states the same thing beside the
code.

### The local shopper

Seeded in `services/customer-service/Services/CustomerService.cs`, which hashes it at
startup - the clear text exists only in that one line of source and here:

| login | password |
|---|---|
| `john.doe@example.com` | `shopper-local-2026` |

`maria.alvarez@example.com` carries the same password, as a spare. Every other seeded
customer has no password and therefore cannot sign in. The data is in memory, so
restarting `customer-service` puts both accounts back exactly as they were.

## What the API doesn't offer, and what this app therefore doesn't do

- **No cart.** An order is placed directly from a product page for one product and a
  quantity. `POST /orders` does accept an `items` array, so a cart could exist without
  changing the backend - it just isn't built, per the brief.
- **No password reset, no email verification, no roles.** Sign-in exists (below);
  everything usually built beside it does not.
- **No admin actions.** A shopper cannot change their own order's status - that's a
  separate concern (Shop Admin, elsewhere in this repo). The order-detail page only ever
  displays status; it never mutates it (`orders-service` does expose
  `PUT /orders/:id/status`, but nothing in this brief called for a shopper-facing use of
  it, so it isn't wired up).
- **No account deletion in the UI**, though `DELETE /customers/:id` exists on the
  service - out of scope for the browse/register/order narration this app is built for.
- **No product images.** `imageUrl` exists on `Product` but every URL in the seed data
  points at `example.com`, which resolves to nothing real - the product cards use a
  gradient placeholder frame instead of a broken `<img>`.
- **No price recomputation in the browser.** The button on a product page shows
  `basePrice x quantity`, because that's genuinely all the storefront can compute without
  calling `POST /products/:id/price` itself (which needs the customer's discounts,
  fetched by `orders-service`, not this app). The real, discounted total only exists once
  `POST /orders` has run, which is why it's shown on the confirmation page, not before.

## Stack and dependencies, and why each one is here

- **Vite + React + TypeScript** - required by the brief.
- **react-router-dom** - the app has eight distinct URL-addressable screens
  (browse, product, register, sign-in, account, orders, order detail, 404); without a router this
  would be one giant component switching on manually-tracked state, which is worse for a
  live local where the back button and shareable URLs (e.g. reopening a specific order)
  matter.
- **No state-management library.** The only cross-page state is the session - the
  token and the customer behind it - held in one `React.Context` (`CustomerContext`).
  One small context does the whole job; a library would add ceremony for a single value.
- **No CSS framework.** Hand-written CSS custom properties (`src/styles/global.css`,
  `components.css`) give full control over the dark theme and are small enough (~15 KB
  built) that a framework wouldn't save anything.
- **No HTTP client library.** The browser's built-in `fetch` is enough for three JSON
  services; `src/api/client.ts` wraps it once for error normalization.
- **Vitest + @testing-library/react + jsdom** - the project's test runner (a natural fit
  for a Vite app), for unit/component tests. `npm test` runs them; see "What was tested"
  below. They are not a substitute for running the app against the real services, which
  is documented separately in the delivery notes for this build.

## Commands

```bash
npm run dev          # start the dev server on :3010
npm run build         # type-check, then production build
npm run preview       # preview the production build
npm run type-check    # tsc --noEmit only
npm test              # vitest run - unit/component tests
```

## Project layout

```
src/
  api/            fetch wrapper (client.ts) + types mirrored from the three services
  components/     shared UI: Layout, StatusBadge, StatusStepper, ErrorPanel, ProductCard, ...
  context/        CustomerContext - the one piece of client-only "who's shopping" state
  lib/            formatting helpers (currency, date)
  pages/          one file per screen
  styles/         global.css (theme tokens) + components.css (shared UI primitives)
  test/           vitest setup (jest-dom matchers)
```
