# Contract Testing with Shared JSON Contracts

## Overview

This demonstrates **Consumer-Driven Contract Testing** using shared JSON contract files for testing **3 key Product Service endpoints**.

## Structure

```
contract-tests/
├── contracts/
│   └── orders-products-bidirectional.pact.json  # Generated bidirectional contract
├── src/
│   ├── client/
│   │   ├── productService.ts            # ProductService client
│   │   └── types.ts                     # Type definitions
│   └── __tests__/
│       ├── contract-validation/
│       │   ├── orders-consumer-validation.test.ts   # Basic consumer tests
│       │   └── products-provider-validation.test.ts # Basic provider tests
│       └── enhanced/
│           ├── orders-consumer-enhanced.test.ts     # Enhanced consumer tests
│           └── products-provider-enhanced.test.ts   # Enhanced provider tests
```

## The 3 Product Service Endpoints

1. **GET /products/1** - Get product details
2. **POST /products/1/price** - Get customer-specific pricing
3. **GET /health** - Service health check

## Key Benefits

✅ **Single Source of Truth** - Contract defined once in JSON, used by both services
✅ **Clean & Simple** - Focused on just the essential 3 endpoints
✅ **Cross-team Collaboration** - Human-readable JSON format
✅ **Version Control** - Clear contract evolution tracking

## How It Works

### Consumer Tests (Orders Service)
- Load contract from JSON file
- **Use actual ProductService class** from Orders Service
- Test real client code against mock service based on contract
- Verify Orders Service can handle expected responses

### Provider Tests (Products Service)
- Load same contract from JSON file
- Validate contract structure and requirements
- Can verify real service against contract (when service is running)

## Usage

### Jest Tests (Original)

#### Consumer Tests (Orders Service)
Consumer tests use mock servers, so no actual service needs to be running:

```bash
# Run consumer tests only
npm run test:contract-validation-consumer
```

#### Provider Tests (Products Service)
For **full provider verification**, you need to start the Products Service first:

```bash
# Terminal 1: Start the Products Service
cd ../services/products-service
npm run build
npm start

# Terminal 2: Run provider verification
cd contract-tests
npm run test:contract-validation-provider
```

#### All Jest Tests
```bash
# Run all contract validation tests
npm run test:contract-validation

# Run all tests including enhanced tests
npm run test:all
```

### Vitest Tests (Performance PoC)

#### Quick Vitest Setup
```bash
# Install Vitest dependencies
npm install --save-dev vitest @vitest/coverage-v8
```

#### Running Vitest Tests
```bash
# Run Vitest consumer tests
npm run vitest:contract-validation-consumer

# Run Vitest provider tests  
npm run vitest:contract-validation-provider

# Run all Vitest contract tests
npm run vitest:contract-validation

# Run all Vitest tests
npm run vitest:all
```

### Performance Benchmarking

```bash
# Run comprehensive performance benchmark
npm run benchmark:full

# Quick time comparison
npm run benchmark:compare

# Individual framework timing
npm run benchmark:jest
npm run benchmark:vitest
```

### Migration Guide

See [VITEST-MIGRATION-GUIDE.md](./VITEST-MIGRATION-GUIDE.md) for:
- 📊 Performance comparison results
- 🔧 Configuration differences  
- 🧪 Test migration patterns
- 💡 Migration recommendations

## Test Results

### ✅ Consumer Tests (Orders Service)
- **Real ProductService Integration**: Uses actual `ProductService` class from Orders Service
- **Contract validation**: All 3 endpoints properly defined in shared JSON
- **Type safety**: Full TypeScript integration with real client types

### ✅ Provider Tests (Products Service)
- **Contract structure validation**: Validates all 3 endpoints are properly defined
- **Full provider verification**: When service is running, verifies all 3 endpoints against contract:
 - ✅ GET /products/1 - Product details (200 OK)
 - ✅ POST /products/1/price - Customer pricing (200 OK)
 - ✅ GET /health - Health check (200 OK)
- **Provider states**: Correctly handles state setup for each test scenario

## Key Benefits Achieved

✅ **Uses Real Implementation**: Tests run against actual `ProductService` client code, not mock HTTP calls
✅ **Single Source of Truth**: Contract defined once in JSON, used by both services
✅ **Type Safety**: Full TypeScript support with real interfaces
✅ **Maintainable**: Changes to client code automatically tested against contract

This demonstrates the shared JSON contract approach with real client code integration for the 3 key Product Service endpoints.