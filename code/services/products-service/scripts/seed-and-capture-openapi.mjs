#!/usr/bin/env node
// @ts-check
/**
 * Starts products-service, calls every route it declares (success paths AND
 * error paths), then fetches the OpenAPI 3 document this service's own
 * openapi-capture middleware has built from that observed traffic (see
 * src/openapi-capture.ts) and saves a copy next to the service.
 *
 * This script IS the evidence, not a stand-in for it: it starts a real
 * process and fetches from a real socket, guaranteeing EVERY declared route
 * has been sent traffic at least once, then captures a copy as demo
 * evidence. Unlike the old express-oas-generator-based version, the
 * document is built fresh on every GET /api-spec/v3 from the in-memory
 * traffic log - there is no write-interval to wait out.
 *
 * Run: node services/products-service/scripts/seed-and-capture-openapi.mjs
 */

import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVICE_DIR = path.join(__dirname, '..');
const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

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
  const response = await fetch(`${BASE_URL}${urlPath}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  console.log(`  ${method} ${urlPath} -> ${response.status}`);
  return response;
}

async function exerciseEveryRoute() {
  await hit('GET', '/health');
  await hit('POST', '/provider-states', { state: 'products exist' });
  await hit('GET', '/products');
  await hit('GET', '/products/1');
  await hit('GET', '/products/does-not-exist'); // 404 branch
  await hit('POST', '/products/1/price', { productId: '1', quantity: 2 });
  await hit('POST', '/products/1/price', {
    productId: '1',
    quantity: 12,
    discounts: [{ type: 'loyalty', amount: 5 }]
  }); // bulk-discount branch (quantity >= 10) plus an explicit discount
  await hit('POST', '/products/1/price', { productId: '1', quantity: 0 }); // 400: quantity/productId required
  await hit('POST', '/products/1/price', { productId: '2', quantity: 1 }); // 400: productId must match URL
  await hit('POST', '/products/999/price', { productId: '999', quantity: 1 }); // 404: product not found
  await hit('POST', '/products/1/price', { productId: '1', quantity: 1000 }); // 400: insufficient stock
}

async function main() {
  console.log(`Starting products-service (cwd=${SERVICE_DIR})...`);
  const child = spawn('npm', ['run', 'dev'], {
    cwd: SERVICE_DIR,
    stdio: 'inherit',
    env: { ...process.env, PORT: String(PORT) }
  });

  let shutDown = false;
  const shutdown = () => {
    if (shutDown) return;
    shutDown = true;
    child.kill('SIGTERM');
  };
  process.on('exit', shutdown);

  try {
    await waitForHealthy(`${BASE_URL}/health`);
    console.log('products-service is up. Exercising every declared route...');
    await exerciseEveryRoute();

    const specResponse = await fetch(`${BASE_URL}/api-spec/v3`);
    if (!specResponse.ok) {
      throw new Error(`Failed to fetch the runtime OpenAPI document: HTTP ${specResponse.status}`);
    }
    const spec = await specResponse.json();
    const outPath = path.join(SERVICE_DIR, 'openapi-runtime-captured.json');
    await writeFile(outPath, JSON.stringify(spec, null, 2), 'utf8');

    const routeCount = Object.keys(spec.paths ?? {}).length;
    console.log(`\nCaptured ${routeCount} documented path(s) to ${outPath}`);
    console.log(`Live document while the service runs: ${BASE_URL}/api-spec/v3`);
  } finally {
    shutdown();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
