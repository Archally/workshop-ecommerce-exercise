# Shop Admin

The back-office console for the shop. Built for one purpose: projected on a screen at a
conference while someone narrates a business process out loud, right before an Event
Storming session. A viewer at the back of the room should be able to follow *what just
happened in the business* - a price quoted, an order moved to its next state - not what
HTTP call fired. An operator signs in before any of it is reachable.

Angular 22, standalone components, no NgModules, no component kit. Dependencies used and
why:

- `@angular/common`, `@angular/core`, `@angular/forms`, `@angular/platform-browser`,
  `@angular/router` - the framework itself. `HttpClient` (from `@angular/common/http`)
  is the only way this app talks to a backend; `FormsModule` backs the two-way-bound
  quantity/discount/filter inputs.
- `rxjs` - required by `HttpClient` and the router's event stream (used once, to derive
  the top-bar section label from the current route).
- Dev-only: `@angular/build`, `@angular/cli`, `@angular/compiler-cli`, `typescript`,
  `vitest`, `jsdom` - the build and test toolchain. No UI kit, no icon font, no state
  library, no CSS framework: every visual is hand-styled CSS custom properties in
  `src/styles.css`, and every icon is a plain Unicode character.

## Before the talk: start everything, in this order

Four terminals, four `cd`s. Run these from the repository root
(`contract-tests-poc/`), each in its own terminal tab, in this order so a later
service's health check has something to point at:

```bash
# 1. Products service (port 3001)
cd services/products-service
npm install   # first time only
npm run dev

# 2. Orders service (port 3002) - calls products-service and customer-service
cd services/orders-service
npm install   # first time only
npm run dev

# 3. Customer service (port 3003, .NET)
cd services/customer-service
dotnet run --urls http://localhost:3003

# 4. Shop Admin itself (port 4200)
cd apps/shop-admin
npm install   # first time only
npm start
```

Then open **http://localhost:4200**. The back office is closed: every route redirects to
`/sign-in` until an operator signs in.

## Signing in

`POST /operators/sign-in` on customer-service (:3003) takes a login and a password and
returns an opaque session token plus the operator it belongs to. The browser keeps the
token in `localStorage` under `shop-admin.sessionToken` and nothing else; the operator
behind it is re-read at `GET /operators/session` on the first guarded navigation, so a
revoked token resolves to nobody. Signing out revokes it at `DELETE /operators/session`.
The storefront does exactly this for shoppers, against `/customers` instead.

`operatorGuard` (`src/app/core/operators/operator-guard.ts`) carries every route but the
sign-in screen. A refused sign-in says "Login or password is incorrect" and never which
half was wrong, because that is the one message the service returns for both cases.

What this deliberately is not: not a JWT, not persistent (restarting customer-service
signs everybody out), not expiring, and not authorization - only the session endpoints
check the token, every other endpoint on the service is open.
`services/customer-service/Services/SessionStore.cs` states the same thing beside the
code.

### The local operator

Seeded in `services/customer-service/Services/OperatorService.cs`, which hashes it at
startup - the clear text exists only in that one line of source and here:

| login | password |
|---|---|
| `nina.osei@example.com` | `operator-local-2026` |

The other seeded operators have no password and cannot sign in. The data is in memory, so
restarting `customer-service` puts the account back exactly as it was.

To check everything is actually up before you go on stage:

```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

Each should answer `{"status":"healthy",...}`. If `3002`'s answer shows
`"productsService":"unhealthy"` or `"customerService":"unhealthy"` in its
`dependencies`, that service was not started first - stop it, confirm 3001 and 3003
answer their own `/health`, then restart `orders-service`.

## What each screen does

- **Products** (`/products`) - the catalog, as `products-service` currently has it.
  Open one to see its full record and a **price quote** tool: pick a quantity and an
  optional discount, get back what `products-service` would charge. Quantities of 10+
  trigger the service's own automatic 5% bulk discount - a good moment to narrate. This
  does **not** change the catalog price shown above it; `products-service` has no
  endpoint that persists a price change, only one that computes a quote (see
  "Decisions" below).
- **Orders** (`/orders`) - every order `orders-service` knows about, customer names
  resolved via `customer-service`. Open one to see its items and to **move it to its
  next status** - the one write `orders-service` offers. The status pill changes, the
  Activity panel narrates the transition (old status struck through, new one as a
  pill), and the row flashes if you're back on the list when it happens.
- **Customers** (`/customers`) - active customers from `customer-service`, each with
  their discounts. Open one to see the same, plus a **Remove customer** action guarded
  by a confirm step.

The right-hand **Activity** panel (a bottom drawer below 1024px wide, behind an
"Activity" tab) is the narration feed: every price quote and every order-status change
appends one line, newest first, kept for the current session only.

## What was deliberately left out

- **No product publish, no category create.** The brief for this app and the modelled
  system both describe them; this codebase's `products-service` has neither endpoint.
  Nothing here simulates one.
- **No customer create or edit.** `customer-service` exposes `POST /customers` and
  `PUT /customers/:id`, but that is the storefront's registration/self-service surface,
  not a back-office one - this app never calls them.
- **No order creation.** `POST /orders` calls `products-service` twice per line item and
  is the storefront's checkout flow. Shop Admin only reads orders and moves an existing
  one to its next status.
- **DELETE on a customer is wired in, deliberately.** Removing a customer (e.g. an
  account closure) is legitimate back-office work, unlike creating or editing one, so
  the control exists - behind a confirm step, since the sample data is in-memory and a
  delete has no undo until the service restarts.

## A decision worth knowing before you narrate it

`POST /products/:id/price` reads as "change the price" from its name and its route, but
reading `services/products-service/src/server.ts` shows it only **computes and returns** a price
for a quantity and a set of discounts - it never writes back to the product record. So
the Products screen calls it a **price quote**, not a price edit: the panel says plainly
that it does not touch the catalog price, and the Activity feed logs it as an
informational line rather than a state transition. The one real state transition in this
app - the thing actually worth stopping the narration on - is an order's status.

## Running the tests

```bash
npm test
```

Runs on Vitest via Angular's `@angular/build:unit-test` builder (the current Angular CLI
default - no Karma, no Jasmine). 59 tests across 15 spec files, colocated beside the
component or service they cover. These test the app's own logic and rendering against a
mocked HTTP layer; they are not a substitute for the walkthrough above against the three
real services.

```bash
npm run build   # production build; also the strict TypeScript check
```
