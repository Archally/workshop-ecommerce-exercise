# Inventory Service

A .NET 10 ASP.NET Core Web API implementing service design  (InventoryService),

## What the model says this service does

's OpenAPI contract (`inventory-api`) exposes two operations, both implemented here:

- ** - Reserve Stock**: `POST /inventory/reserve`. Moves a quantity from
  available to reserved and creates a hold , or returns 409 with
   (Insufficient Stock, retry eligible) if the warehouse cannot cover it.
- ** - Check Stock**: `GET /inventory/{sku}/stock`. Returns available /
  reserved / total for a SKU .

## What the model asked for that was not built

's asyncapi contract (`inventory-events`) also declares:

- Reserve Stock **reacting to** the Orders event `` (Order Submitted) - stock
  would be held automatically when an order is submitted, not only when something calls
  `POST /inventory/reserve` directly.
- **Publishing** `` (Stock Reserved) onto the event bus after a successful
  reservation.

Neither is wired here. This repository has no messaging dependency today (no broker, no
client library, nothing subscribing to anything), and adding one is a separate, blocked
task, not this one. The synchronous HTTP path the model also declares
(`initiated_by: `, i.e. an order system calling in directly) is fully built
and is the only trigger for Reserve Stock in this codebase.

Also unbuilt, because the model itself says they are open questions rather than decisions:
reservation expiry is never enforced by an operation (, -
this implementation picks its own 15-minute window as a placeholder), and there is no way
to look up which order holds a given reservation .

## Running

```bash
# From project root
npm run start:inventory
# or
make run-inventory-service
# or directly
cd services/inventory-service && dotnet run --urls http://localhost:3004
```

Swagger UI is served at the root URL in development mode.

## Port

- HTTP: `http://localhost:3004`
- HTTPS: `https://localhost:7004`

## Sample data

Seeded with the same SKUs and quantities products-service already serves
(`services/products-service/src/catalog/productCatalog.ts`), so a request against a SKU the storefront shows returns
something meaningful. `UBL-005` starts at 3 units on purpose - the same "near out-of-stock"
seed products-service uses - so Insufficient Stock is reachable without editing the data.
A SKU nobody has ever stocked reads as zero on every count rather than 404: the model
declares only a 200 response for Check Stock.

See `InventoryService.http` for worked requests, including the 409 case.
