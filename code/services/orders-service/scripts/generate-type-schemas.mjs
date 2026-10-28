#!/usr/bin/env node
// @ts-check
/**
 * Runs ONCE, at build/dev-start time (see package.json's predev/prebuild
 * hooks), never at runtime: reads every exported interface this service
 * already declares in src/types.ts through the TypeScript compiler API
 * (ts-json-schema-generator) and writes a flat, $ref-free JSON Schema per
 * type to src/openapi-type-schemas.generated.json.
 *
 * This is the compiler-checked half of openapi-capture.ts's request/response
 * schemas: CreateOrderRequest and Order are types a handler actually
 * assigns a value to (see server.ts) - if a handler ever
 * constructed an object that didn't satisfy one of them, `tsc` would refuse
 * to build, so the shape recorded here cannot silently drift from the code
 * the way a traffic-observed shape can. See the file header of
 * openapi-capture.ts for the parts of the document that still come from
 * traffic instead (status codes always; anything with no named interface).
 *
 * ts-json-schema-generator, its own dependency tree, and this script are all
 * devDependencies - none of it is imported by server.ts or lands in dist/,
 * only the flat JSON file this script writes does.
 *
 * Run directly: node scripts/generate-type-schemas.mjs
 */

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGenerator } from 'ts-json-schema-generator';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVICE_DIR = path.join(__dirname, '..');
const OUT_PATH = path.join(SERVICE_DIR, 'src', 'openapi-type-schemas.generated.json');

const config = {
  path: path.join(SERVICE_DIR, 'src', 'types.ts'),
  tsconfig: path.join(SERVICE_DIR, 'tsconfig.json'),
  type: '*',
  expose: 'export',
  // Shape extraction only - full type-checking is tsc/ts-node's job and
  // already runs on every `npm run dev`/`npm run build`. Skipping it here
  // just keeps this generation step fast.
  skipTypeCheck: true
};

const schema = createGenerator(config).createSchema(config.type);
const definitions = /** @type {Record<string, unknown>} */ (schema.definitions ?? {});

/**
 * ts-json-schema-generator points a nested named type (e.g. Order.status:
 * OrderStatus) at `{ "$ref": "#/definitions/OrderStatus" }`. OpenAPI 3.0
 * would need that rewritten to `#/components/schemas/...`; simpler and
 * consistent with the rest of this document (nothing else in it uses
 * `$ref`) is to just inline the referenced definition here, once, at
 * generation time - so every consumer of this file gets a flat, standalone
 * schema per type with nothing left to resolve.
 * @param {unknown} node
 * @returns {unknown}
 */
function dereference(node) {
  if (Array.isArray(node)) return node.map(dereference);
  if (node && typeof node === 'object') {
    const ref = /** @type {{ $ref?: string }} */ (node).$ref;
    if (typeof ref === 'string' && ref.startsWith('#/definitions/')) {
      const name = ref.slice('#/definitions/'.length);
      if (!(name in definitions)) throw new Error(`generate-type-schemas: unresolved $ref "${ref}"`);
      return dereference(definitions[name]);
    }
    /** @type {Record<string, unknown>} */
    const out = {};
    for (const [key, value] of Object.entries(node)) out[key] = dereference(value);
    return out;
  }
  return node;
}

/** @type {Record<string, unknown>} */
const flat = {};
for (const [name, definition] of Object.entries(definitions)) flat[name] = dereference(definition);

writeFileSync(OUT_PATH, `${JSON.stringify(flat, null, 2)}\n`, 'utf8');
console.log(`Wrote ${Object.keys(flat).length} type schema(s) to ${OUT_PATH}`);
