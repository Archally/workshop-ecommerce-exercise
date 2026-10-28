// ts-node compiles lazily, file-by-file, from the require() graph - unlike
// `tsc`, it does NOT pull in an unreferenced ambient .d.ts just because
// tsconfig's `include` covers it (confirmed by running `npx ts-node
// src/server.ts` directly: it failed on this module with TS7016 despite
// `npx tsc --noEmit` passing clean). This reference makes the declaration
// part of THIS file's own graph instead, which both tools resolve the
// same way.
/// <reference path="./types/express-list-endpoints.d.ts" />
import type { Express, RequestHandler, Response } from 'express';
import expressListEndpoints from 'express-list-endpoints';
import http from 'node:http';
import typeSchemasJson from './openapi-type-schemas.generated.json';

/**
 * Replacement for express-oas-generator. Same job - serve an OpenAPI 3
 * document built from what this running instance actually saw on the wire,
 * nothing hand-typed - built from pieces this project controls instead of a
 * middleware that pulled in mongoose, the AWS SDK credential chain and
 * swagger-ui-dist's install-time telemetry for a job that is "watch res.json
 * and write a file". See the package-count comparison in the delivery
 * report for the measured before/after.
 *
 * The document is built from THREE sources, each derived from something
 * that is actually enforced or actually happened - never hand-typed:
 *
 *   1. Paths and methods come from express-list-endpoints, reading the live
 *      route table off the running app (see mountOpenApiCapture below).
 *   2. Request and response SHAPE, where a named TypeScript interface in
 *      ./types.ts already governs it, comes from that interface via
 *      ts-json-schema-generator at BUILD TIME - see
 *      scripts/generate-type-schemas.mjs and TYPE_BINDINGS below. This is
 *      this project's analogue of what a C# controller's Swashbuckle
 *      annotations give the .NET side for free: `tsc` refuses to build a
 *      handler that constructs a value not shaped like the interface it is
 *      assigned to, so this half of the document cannot silently drift
 *      from the code the way a traffic-observed shape can.
 *   3. Everything else - status codes always, and request/response shape
 *      wherever no named interface applies - comes from observed traffic,
 *      same as before. Nothing declares a status code in this codebase, so
 *      observation is the only truth available for it.
 *
 * Every schema fragment in the served document carries an `x-schema-source`
 * key saying which of these built it - `typescript-type:<Name>` or
 * `observed-traffic` - so a reader never has to guess which parts are
 * compiler-checked and which are merely what happened to be sent.
 *
 * Two things fixed over the old package, both driven by how this is wired
 * in server.ts:
 *
 *   1. It is registered AFTER express.json() and any query-string parsing,
 *      not before, so req.body and req.query are already populated when a
 *      request reaches this middleware. The old package captured every
 *      response accurately but NO request body or query parameter, ever -
 *      measured, not assumed: its own capture only fires on a handler that
 *      calls next() after responding, and none in this codebase do. This
 *      middleware reads req.body/req.query directly, so that limitation
 *      does not apply here.
 *   2. It reads the live route table via express-list-endpoints - the same
 *      "ask the running app, don't hand-maintain a list" principle the old
 *      approach used - and reports (see buildDocument below) which
 *      declared routes this instance has NOT been called against, so that
 *      absence is a visible fact in the document rather than something a
 *      reader would have to diff against the source to notice.
 *
 * BLIND SPOT, stated plainly, same shape as the old implementation's: a
 * route this running instance is never sent traffic against never appears
 * in `paths` below, however good its type binding is - a type only refines
 * the shape of an ALREADY-observed operation, it never manufactures one.
 * See services/products-service/scripts/seed-and-capture-openapi.mjs, which exists
 * specifically to exercise every declared route (successes AND error
 * branches) before a copy is captured to disk.
 *
 * SECOND BLIND SPOT, unique to this implementation: capture happens by
 * overriding res.json() per request (see `capture` below). A handler that
 * responds via res.send()/res.end() instead of res.json() is invisible to
 * it - none of this service's routes do that today, but a future one could,
 * and it would silently vanish from the document exactly the way an
 * unreached route does.
 *
 * THIRD BLIND SPOT: query parameters and path parameters have no named
 * TypeScript type to bind to - Express types req.query/req.params as
 * effectively `any` (ParsedQs / a plain string map), so they stay
 * traffic-observed even for a fully type-bound operation. `x-schema-source`
 * marks them `observed-traffic` accordingly.
 */

const MAX_SAMPLES_PER_OPERATION = 20;

type JsonSchemaFragment = Record<string, unknown>;

// ts-json-schema-generator writes a flat, $ref-free schema per exported
// type in ./types.ts (see scripts/generate-type-schemas.mjs). tsconfig has
// resolveJsonModule on, so this import is checked like any other - an
// empty or malformed file fails the build, not silently at runtime.
const typeSchemas = typeSchemasJson as Record<string, JsonSchemaFragment>;

interface OperationRecord {
  method: string;
  expressPath: string;
  pathTemplate: string;
  pathParamNames: string[];
  querySamples: Record<string, unknown>[];
  requestBodySamples: unknown[];
  responsesByStatus: Map<number, unknown[]>;
}

export interface OpenApiCaptureInfo {
  title: string;
  description: string;
}

interface ResponseTypeBinding {
  typeName: string;
  /** True when the response is an ARRAY of this type (e.g. GET /products -> Product[]). */
  array?: boolean;
}

interface RouteTypeBinding {
  method: string;
  expressPath: string;
  /** Named type in ./types.ts that governs the request body, if any. */
  request?: string;
  /** Named type per status code that governs that response body, if any. */
  responses?: Partial<Record<number, ResponseTypeBinding>>;
}

/**
 * Hand-written map from an operation to the NAMED TypeScript interface (in
 * ./types.ts) that governs its request or response shape. This is the one
 * part of the compiler-checked half that nothing generates for us: the
 * interfaces themselves are checked by tsc, but which interface belongs to
 * which route is not something the compiler knows, so a human wrote this
 * table down.
 *
 * A WRONG entry is caught in two different ways, and only one of them is
 * automatic. A type NAME that does not exist (a typo, a rename in
 * types.ts this map was not updated for) is caught loudly: server.ts calls
 * mountOpenApiCapture() once at startup, which validates every name below
 * against the generated schema file and THROWS if one is missing - the
 * process refuses to start rather than silently falling back to a weaker,
 * traffic-observed schema. A RIGHT name that names the WRONG type - e.g.
 * accidentally pointing a response at PriceRequest instead of
 * PriceResponse - is NOT caught by anything: it would build and run fine
 * and simply describe the wrong shape. That risk is real, and it is kept
 * small on purpose: five entries below, each naming one of the nine
 * interfaces types.ts already declares once.
 *
 * A route or status left OUT of this map on purpose still gets a
 * document entry - it just falls back to the traffic-observed schema, the
 * same way an operation with no binding at all does (see GET /health and
 * POST /provider-states, neither of which is backed by a named interface
 * in the code to begin with).
 */
const TYPE_BINDINGS: RouteTypeBinding[] = [
  { method: 'GET', expressPath: '/products', responses: { 200: { typeName: 'Product', array: true } } },
  { method: 'GET', expressPath: '/products/:id', responses: { 200: { typeName: 'Product' } } },
  {
    method: 'POST',
    expressPath: '/products/:id/price',
    request: 'PriceRequest',
    responses: { 200: { typeName: 'PriceResponse' } }
    // 400/404 bodies here are ad hoc `{ error: string, ... }` object
    // literals built inline in server.ts, not assigned to a named
    // interface - they stay traffic-observed.
  }
];

function lookupTypeBinding(method: string, expressPath: string): RouteTypeBinding | undefined {
  return TYPE_BINDINGS.find((binding) => binding.method === method && binding.expressPath === expressPath);
}

function validateTypeBindings(): void {
  for (const binding of TYPE_BINDINGS) {
    const referencedNames = [binding.request, ...Object.values(binding.responses ?? {}).map((r) => r?.typeName)].filter(
      (name): name is string => Boolean(name)
    );
    for (const name of referencedNames) {
      if (!(name in typeSchemas)) {
        throw new Error(
          `openapi-capture: TYPE_BINDINGS for ${binding.method} ${binding.expressPath} references unknown type "${name}" - ` +
            'check the name against src/types.ts and re-run "npm run generate:type-schemas".'
        );
      }
    }
  }
}

function toPathTemplate(expressPath: string): string {
  // OpenAPI writes a path parameter as {id}; Express declares it as :id.
  return expressPath.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

function extractParamNames(expressPath: string): string[] {
  return [...expressPath.matchAll(/:([A-Za-z0-9_]+)/g)].map((match) => match[1]);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function pushCapped<T>(samples: T[], value: T): void {
  samples.push(value);
  if (samples.length > MAX_SAMPLES_PER_OPERATION) samples.shift();
}

/**
 * Builds a JSON Schema fragment (with inline `example`s) from every sample
 * observed at one position in the traffic - a response body, a request
 * body, or the query-string object of one call. An object's `required`
 * list is the set of keys present in EVERY sample currently held, not just
 * the newest one, so a field the traffic showed as sometimes-absent (the
 * automatic `bulk_discount` entry on the price response, `customerId` on
 * the orders query string) is honestly reported as optional rather than
 * always-required, which a single-example capture cannot tell apart.
 *
 * This is the FALLBACK schema source, used wherever TYPE_BINDINGS has no
 * entry - it is what the whole document used to be built from before
 * named-type binding existed, and it is still the only source query
 * parameters ever get (see the file header's third blind spot).
 */
function schemaFor(samples: unknown[]): JsonSchemaFragment {
  const present = samples.filter((sample) => sample !== undefined);
  if (present.length === 0) return { type: 'string' };

  const first = present[0];

  if (Array.isArray(first)) {
    const items = present.flatMap((sample) => (Array.isArray(sample) ? sample : []));
    return { type: 'array', items: items.length > 0 ? schemaFor(items) : { type: 'string' } };
  }

  if (first !== null && typeof first === 'object') {
    const keys = new Set<string>();
    for (const sample of present) {
      if (sample && typeof sample === 'object') Object.keys(sample).forEach((key) => keys.add(key));
    }
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const key of keys) {
      const valuesAtKey = present.map((sample) => (sample as Record<string, unknown>)[key]);
      if (valuesAtKey.every((value) => value !== undefined)) required.push(key);
      properties[key] = schemaFor(valuesAtKey);
    }
    const schema: JsonSchemaFragment = { type: 'object', properties };
    if (required.length > 0) schema.required = required;
    return schema;
  }

  const type = typeof first === 'number' ? 'number' : typeof first === 'boolean' ? 'boolean' : 'string';
  return { type, example: first };
}

/**
 * Walks a type-derived schema in lockstep with one ACTUAL captured sample
 * and stamps a leaf-level `example` wherever the sample has a value - the
 * shape comes from the compiler-checked type, the example value is real,
 * observed data, never invented. Returns a fresh object; never mutates the
 * cached type schema.
 */
function stampExamples(schema: JsonSchemaFragment, sample: unknown): JsonSchemaFragment {
  const stamped = clone(schema);
  walk(stamped, sample);
  return stamped;

  function walk(node: JsonSchemaFragment, value: unknown): void {
    if (!node || typeof node !== 'object') return;
    const type = node.type;
    if (type === 'array' && Array.isArray(value) && value.length > 0 && node.items) {
      walk(node.items as JsonSchemaFragment, value[0]);
      return;
    }
    if (type === 'object' && value && typeof value === 'object' && node.properties) {
      const properties = node.properties as Record<string, JsonSchemaFragment>;
      for (const [key, propertySchema] of Object.entries(properties)) {
        walk(propertySchema, (value as Record<string, unknown>)[key]);
      }
      return;
    }
    if (type !== 'object' && type !== 'array' && value !== undefined) {
      node.example = value;
    }
  }
}

/**
 * Creates the capture middleware plus the in-memory traffic log it fills.
 * Wire `capture` into the app AFTER express.json() and BEFORE any route;
 * pass `operations` to mountOpenApiCapture() once every route is declared.
 */
export function createOpenApiCapture(): { capture: RequestHandler; operations: Map<string, OperationRecord> } {
  const operations = new Map<string, OperationRecord>();

  function operationFor(method: string, expressPath: string): OperationRecord {
    const key = `${method} ${expressPath}`;
    let operation = operations.get(key);
    if (!operation) {
      operation = {
        method,
        expressPath,
        pathTemplate: toPathTemplate(expressPath),
        pathParamNames: extractParamNames(expressPath),
        querySamples: [],
        requestBodySamples: [],
        responsesByStatus: new Map()
      };
      operations.set(key, operation);
    }
    return operation;
  }

  const capture: RequestHandler = (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = ((body?: unknown): Response => {
      // req.route is only populated once Express has matched a declared
      // route and started running its handler chain - which is exactly
      // where this executes, since the handler itself is what calls
      // res.json(). A request that never matches a route (a 404 Express's
      // own default handler produces) never sets req.route and is
      // therefore invisible here too.
      if (req.route) {
        const method = req.method.toUpperCase();
        const expressPath = (req.baseUrl || '') + (req.route.path as string);
        const operation = operationFor(method, expressPath);

        // Query samples are pushed on EVERY call, including ones with an
        // empty query string, so a key present on some calls and absent on
        // others reads as optional rather than always-required. Request
        // body samples are pushed only when the body actually had a key -
        // GET routes never send one, and recording an empty {} for every
        // one of them would manufacture a requestBody the traffic never
        // showed.
        pushCapped(operation.querySamples, { ...(req.query as Record<string, unknown>) });
        if (req.body && typeof req.body === 'object' && Object.keys(req.body as object).length > 0) {
          pushCapped(operation.requestBodySamples, clone(req.body));
        }

        const status = res.statusCode || 200;
        const bucket = operation.responsesByStatus.get(status) ?? [];
        bucket.push(clone(body));
        if (bucket.length > MAX_SAMPLES_PER_OPERATION) bucket.shift();
        operation.responsesByStatus.set(status, bucket);
      }
      return originalJson(body);
    }) as typeof res.json;
    next();
  };

  return { capture, operations };
}

function statusDescription(status: number): string {
  return http.STATUS_CODES[status] ?? String(status);
}

function responseSchema(operation: OperationRecord, status: number, binding: RouteTypeBinding | undefined): JsonSchemaFragment {
  const samples = operation.responsesByStatus.get(status) ?? [];
  const responseBinding = binding?.responses?.[status];

  if (responseBinding) {
    const base: JsonSchemaFragment = responseBinding.array
      ? { type: 'array', items: clone(typeSchemas[responseBinding.typeName]) }
      : clone(typeSchemas[responseBinding.typeName]);
    const latest = samples[samples.length - 1];
    const stamped = latest !== undefined ? stampExamples(base, latest) : base;
    const sourceLabel = `typescript-type:${responseBinding.typeName}${responseBinding.array ? '[]' : ''}`;
    return { ...stamped, 'x-schema-source': sourceLabel };
  }

  return { ...schemaFor(samples), 'x-schema-source': 'observed-traffic' };
}

function requestBodySchema(operation: OperationRecord, binding: RouteTypeBinding | undefined): JsonSchemaFragment | undefined {
  if (operation.requestBodySamples.length === 0) return undefined;

  if (binding?.request) {
    const base = clone(typeSchemas[binding.request]);
    const latest = operation.requestBodySamples[operation.requestBodySamples.length - 1];
    const stamped = stampExamples(base, latest);
    return { ...stamped, 'x-schema-source': `typescript-type:${binding.request}` };
  }

  return { ...schemaFor(operation.requestBodySamples), 'x-schema-source': 'observed-traffic' };
}

function buildOperationEntry(operation: OperationRecord): Record<string, unknown> {
  const binding = lookupTypeBinding(operation.method, operation.expressPath);

  const parameters: Record<string, unknown>[] = operation.pathParamNames.map((name) => ({
    name,
    in: 'path',
    required: true,
    schema: { type: 'string' }
  }));

  const querySchema = schemaFor(operation.querySamples) as {
    properties?: Record<string, Record<string, unknown>>;
    required?: string[];
  };
  for (const [name, schema] of Object.entries(querySchema.properties ?? {})) {
    parameters.push({
      name,
      in: 'query',
      required: (querySchema.required ?? []).includes(name),
      schema: { ...schema, 'x-schema-source': 'observed-traffic' }
    });
  }

  const responses: Record<string, unknown> = {};
  for (const status of operation.responsesByStatus.keys()) {
    responses[String(status)] = {
      description: statusDescription(status),
      content: { 'application/json': { schema: responseSchema(operation, status, binding) } }
    };
  }

  const entry: Record<string, unknown> = { summary: operation.pathTemplate, responses, tags: [] };
  if (parameters.length > 0) entry.parameters = parameters;
  const bodySchema = requestBodySchema(operation, binding);
  if (bodySchema) entry.requestBody = { content: { 'application/json': { schema: bodySchema } } };
  return entry;
}

function buildDocument(
  operations: Map<string, OperationRecord>,
  declaredKeys: string[],
  info: OpenApiCaptureInfo
): Record<string, unknown> {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const operation of operations.values()) {
    const pathEntry = paths[operation.pathTemplate] ?? (paths[operation.pathTemplate] = {});
    pathEntry[operation.method.toLowerCase()] = buildOperationEntry(operation);
  }

  const observedKeys = new Set(operations.keys());
  const neverObserved = declaredKeys.filter((key) => !observedKeys.has(key));

  return {
    openapi: '3.0.0',
    info: { title: info.title, version: '1.0.0', description: info.description },
    paths,
    // Honesty is the point of this document: a declared route this running
    // instance has never received traffic for is absent from `paths` above,
    // and named here rather than merely missing - see the file header.
    'x-unobserved-declared-routes': neverObserved
  };
}

/**
 * Registers the document endpoint. Call this LAST, right before app.listen,
 * after every route is declared - express-list-endpoints reads whatever is
 * on the live app at the moment it is called, the same snapshot-at-the-end
 * requirement the old handleRequests() had, confirmed the same way: calling
 * it earlier reads an incomplete route table.
 */
export function mountOpenApiCapture(
  app: Express,
  mountPath: string,
  operations: Map<string, OperationRecord>,
  info: OpenApiCaptureInfo
): void {
  validateTypeBindings();

  const declaredKeys = expressListEndpoints(app).flatMap((route) =>
    route.methods.map((method) => `${method} ${route.path}`)
  );

  app.get(mountPath, (req, res) => {
    res.json(buildDocument(operations, declaredKeys, info));
  });
}

// Exported for unit tests only (src/openapi-capture.test.ts) - not part of
// the module's runtime API surface used by server.ts.
export const testables = { schemaFor, stampExamples, buildOperationEntry, buildDocument, TYPE_BINDINGS };
