#!/usr/bin/env node
// @ts-check
/**
 * Starts orders-service (and its real dependency, products-service - POST
 * /orders calls out to it and treats a failed lookup as a hard error, so a
 * genuine 201 response can only be observed with it running), calls every
 * route orders-service declares (success paths AND error paths), then
 * fetches the OpenAPI 3 document this service's own openapi-capture
 * middleware has built from that observed traffic (see
 * src/openapi-capture.ts) and saves a copy next to the service.
 *
 * customer-service is NOT started: orders-service's POST /orders handler
 * catches a customer-service failure and continues with an empty discount
 * list, so the write path succeeds without it. Its absence is deliberate,
 * not an oversight.
 *
 * This script IS the evidence, not a stand-in for it: it starts real
 * processes and fetches from a real socket, guaranteeing every declared
 * route has been sent traffic at least once, then captures a copy as demo
 * evidence. Unlike the old express-oas-generator-based version, the
 * document is built fresh on every GET /api-spec/v3 from the in-memory
 * traffic log - there is no write-interval to wait out.
 *
 * Run: node services/orders-service/scripts/seed-and-capture-openapi.mjs
 */

import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ORDERS_SERVICE_DIR = path.join(__dirname, '..');
const PRODUCTS_SERVICE_DIR = path.join(__dirname, '..', '..', 'products-service');

const PRODUCTS_PORT = 3001;
const ORDERS_PORT = 3002;
const ORDERS_BASE_URL = `http://localhost:${ORDERS_PORT}`;

/** @param {string} url @param {{attempts?: number, intervalMs?: number}} [options] */
async function waitForHealthy(url, options = {}) {
  const { attempts = 40, intervalMs = 250 } = options;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Service is not accepting connections yet.
    }
    await delay(intervalMs);
  }
  throw new Error(`Timed out waiting for ${url} to become healthy`);
}

/** @param {string} method @param {string} urlPath @param {unknown} [body] */
async function hit(method, urlPath, body) {
  const response = await fetch(`${ORDERS_BASE_URL}${urlPath}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  console.log(`  ${method} ${urlPath} -> ${response.status}`);
  return response;
}

async function exerciseEveryRoute() {
  await hit('GET', '/health');
  await hit('GET', '/orders');
  await hit('GET', '/orders?customerId=customer-1');
  await hit('GET', '/orders/order-1'); // 200
  await hit('GET', '/orders/does-not-exist'); // 404

  // Real success path: orders-service calls products-service for real.
  await hit('POST', '/orders', { customerId: 'customer-1', items: [{ productId: '1', quantity: 2 }] }); // 201
  await hit('POST', '/orders', { items: [{ productId: '1', quantity: 1 }] }); // 400: customerId required
  await hit('POST', '/orders', { customerId: 'customer-1', items: [{ productId: '1', quantity: 0 }] }); // 400: quantity must be > 0
  await hit('POST', '/orders', { customerId: 'customer-1', items: [{ productId: 'does-not-exist', quantity: 1 }] }); // 400: downstream product lookup fails

  await hit('PUT', '/orders/order-2/status', { status: 'delivered' }); // 200: order-2 seeds as 'shipped', forward transition is legal
  await hit('PUT', '/orders/order-1/status', { status: 'delivered' }); // 400: order-1 seeds as 'confirmed', skips 'shipped'
  await hit('PUT', '/orders/order-1/status', { status: 'not-a-real-status' }); // 400: not a recognised status
  await hit('PUT', '/orders/does-not-exist/status', { status: 'confirmed' }); // 404
}

/** @param {string} cwd @param {Record<string, string>} env */
function startService(cwd, env) {
  return spawn('npm', ['run', 'dev'], {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...env }
  });
}

async function main() {
  console.log(`Starting products-service, orders-service's real dependency (cwd=${PRODUCTS_SERVICE_DIR})...`);
  const productsChild = startService(PRODUCTS_SERVICE_DIR, { PORT: String(PRODUCTS_PORT) });

  console.log(`Starting orders-service (cwd=${ORDERS_SERVICE_DIR})...`);
  const ordersChild = startService(ORDERS_SERVICE_DIR, {
    PORT: String(ORDERS_PORT),
    PRODUCTS_SERVICE_URL: `http://localhost:${PRODUCTS_PORT}`
  });

  let shutDown = false;
  const shutdown = () => {
    if (shutDown) return;
    shutDown = true;
    ordersChild.kill('SIGTERM');
    productsChild.kill('SIGTERM');
  };
  process.on('exit', shutdown);

  try {
    await waitForHealthy(`http://localhost:${PRODUCTS_PORT}/health`);
    await waitForHealthy(`${ORDERS_BASE_URL}/health`);
    console.log('Both services are up. Exercising every route orders-service declares...');
    await exerciseEveryRoute();

    const specResponse = await fetch(`${ORDERS_BASE_URL}/api-spec/v3`);
    if (!specResponse.ok) {
      throw new Error(`Failed to fetch the runtime OpenAPI document: HTTP ${specResponse.status}`);
    }
    const spec = await specResponse.json();
    const outPath = path.join(ORDERS_SERVICE_DIR, 'openapi-runtime-captured.json');
    await writeFile(outPath, JSON.stringify(spec, null, 2), 'utf8');

    const routeCount = Object.keys(spec.paths ?? {}).length;
    console.log(`\nCaptured ${routeCount} documented path(s) to ${outPath}`);
    console.log(`Live document while the service runs: ${ORDERS_BASE_URL}/api-spec/v3`);
  } finally {
    shutdown();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
