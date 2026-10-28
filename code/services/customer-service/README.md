# Customer Service

A .NET 8 ASP.NET Core Web API service providing customer management and discount calculation capabilities.

## Overview

This service is part of the contract testing proof of concept and implements the Customer Service according to the DSL specifications defined in `specs/example.arch.yaml`.

## Technology Stack

- **.NET 8** - Latest LTS version of .NET
- **ASP.NET Core Web API** - Modern web API framework
- **Swagger/OpenAPI** - API documentation and testing interface
- **Built-in Logging** - Comprehensive request/response logging
- **Health Checks** - Application health monitoring

## API Endpoints

### Health Check
- **GET /health** - Returns service health status

### Customer Management
- **GET /customers** - Get all active customers (administrative listing; not self-service)
- **GET /customers/{id}** - Get customer details by ID
- **GET /customers/{id}/discounts** - Get customer-specific discounts
- **POST /customers** - Register a new customer (self-service - a customer creates their own record)
- **PUT /customers/{id}** - Update a customer's own details
- **DELETE /customers/{id}** - Delete a customer

The write endpoints model a customer acting on their own record through a storefront, not an
administrator managing other customers' accounts. There is no bulk-create, bulk-update or
impersonation route, and - matching the rest of this PoC - no authentication or authorization: a
real deployment would need an owner check on `PUT`/`DELETE` (a customer editing or deleting only
their own record), which is out of scope for what this repository demonstrates.

## Port Configuration

- **HTTP**: `http://localhost:3003`
- **HTTPS**: `https://localhost:7003`
- **Swagger UI**: Available at the root URL when running in development mode

## Running the Service

### Prerequisites
- .NET 8 SDK installed

### Local Development
```bash
# From project root
npm run start:customers

# Or directly from customer-service directory
cd services/customer-service
dotnet run
```

### Build Only
```bash
cd services/customer-service
dotnet build
```

## Sample Data

The service includes sample customer data for testing:

### Customers
- **customer-1**: John Doe (Active, with loyalty and bulk discounts)
- **customer-2**: Jane Smith (Active, with premium loyalty discount)  
- **customer-3**: Bob Johnson (Inactive, no discounts)

### Discount Types
- **loyalty**: Customer loyalty discounts (5.0-7.5 amount, 10-15% percentage)
- **bulk**: Bulk purchase discounts (10.0 amount)

## Example API Calls

```bash
# Health check
curl http://localhost:3003/health

# Get all active customers
curl http://localhost:3003/customers

# Get specific customer
curl http://localhost:3003/customers/customer-1

# Get customer discounts
curl http://localhost:3003/customers/customer-1/discounts

# Register a new customer -> 201 Created, body is the created customer
curl -i -X POST http://localhost:3003/customers \
 -H "Content-Type: application/json" \
 -d '{"name":"Alice Newcomer","email":"alice.newcomer@example.com","phone":"555-000-1111","address":"12 New St","city":"Newtown","state":"CA","zip":"90000","country":"USA"}'

# Update a customer's details -> 200 OK, or 404 if the ID does not exist
curl -i -X PUT http://localhost:3003/customers/customer-4 \
 -H "Content-Type: application/json" \
 -d '{"name":"Alice Updated","email":"alice.updated@example.com","phone":"555-999-8888","address":"99 Changed Ave","city":"Changedtown","state":"NY","zip":"10001","country":"USA"}'

# Delete a customer -> 204 No Content, or 404 if already gone / never existed
curl -i -X DELETE http://localhost:3003/customers/customer-4
```

See `CustomerService.http` for the same requests as VS Code REST Client entries, plus the
malformed-body and not-found variants.

## Integration with Other Services

This service is designed to integrate with:
- **Orders Service** - Provides customer data for order processing
- **Products Service** - Customer discounts can be used in pricing calculations

## Architecture Compliance

The service implements the Customer Service definition from the DSL specifications:

- **Bounded Context**: Customer Management
- **Domain**: E-commerce Core Domain
- **Operations Exposed**:
 - `customers:getCustomerById` → GET /customers/{id}
 - `customers:getCustomerDiscounts` → GET /customers/{id}/discounts
 - `customers:createCustomer` → POST /customers
 - `customers:updateCustomer` → PUT /customers/{id}
 - `customers:deleteCustomer` → DELETE /customers/{id}
- **Models**: Based on JSON schemas in `specs/models/customers.yaml`
- **Note**: `GET /customers` (list every customer) is an existing administrative-shaped endpoint
  outside this DSL - it predates the specification and was deliberately left unextended when the
  write side was added, rather than reshaped into something the self-service flow does not need.

## Development Features

- **Comprehensive Logging**: All requests and responses are logged
- **Input Validation**: Model validation with data annotations
- **Error Handling**: Proper HTTP status codes and error responses
- **XML Documentation**: Generated for Swagger UI
- **CORS Configuration**: Enabled for cross-origin requests
- **Dependency Injection**: Clean separation of concerns

## Contract Testing

This service is verified as a provider by `customer-service-contract-tests` (see that project's
README for the full picture). Two things are true about coverage that are worth stating plainly:

- `GET /customers/{id}/discounts` and the generator-invented `GET /health` are the only operations
  `orders-service` actually consumes (`OrderService.uses` in `specs/example.arch.yaml`), so those are
  the only interactions the generated Pact contract (`orders-customers-bidirectional.pact.json`)
  declares and the only ones verified contract-first.
- The three write endpoints are declared and exposed in the same specification
  (`specs/domains/customers.domain`, `specs/example.arch.yaml`) and documented in the generated
  `generated/customerservice-service-openapi.yaml`, but **no service in this repository consumes
  them as a Pact consumer** - a customer registering, updating or deleting their own record does so
  through a storefront that has no representation here, not through `orders-service`. A
  consumer-driven contract generator correctly emits nothing for an operation nobody declares using.
  They are still exercised against the real hosted provider, directly rather than contract-first, in
  `Tests/CustomerServiceWriteEndpointTests.cs`.
