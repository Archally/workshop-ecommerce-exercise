import { describe, expect, it } from 'vitest';
import { testables } from './openapi-capture';
import typeSchemas from './openapi-type-schemas.generated.json';

const { schemaFor, stampExamples, buildDocument, TYPE_BINDINGS } = testables;

describe('schemaFor (the observed-traffic fallback)', () => {
  it('reads a sometimes-absent query key as optional, not required', () => {
    // Mirrors GET /orders: one call has no query string, another has
    // ?customerId=... - customerId must come out optional.
    const schema = schemaFor([{}, { customerId: 'customer-1' }]) as { required?: string[] };
    expect(schema.required ?? []).toEqual([]);
  });

  it('marks a field required only when every sample carried it', () => {
    const schema = schemaFor([{ a: 1, b: 'x' }, { a: 2 }]) as { required?: string[] };
    expect(schema.required).toEqual(['a']);
  });
});

describe('stampExamples', () => {
  it('stamps a leaf example from a real sample and leaves the source schema untouched', () => {
    const typeSchema = { type: 'object', properties: { status: { type: 'string', enum: ['pending', 'shipped'] } }, required: ['status'] };
    const stamped = stampExamples(typeSchema, { status: 'shipped' }) as {
      properties: Record<string, { example?: unknown }>;
    };
    expect(stamped.properties.status.example).toBe('shipped');
    expect((typeSchema.properties.status as { example?: unknown }).example).toBeUndefined();
  });
});

describe('TYPE_BINDINGS', () => {
  it('references only type names that generate-type-schemas.mjs actually produced', () => {
    for (const binding of TYPE_BINDINGS) {
      const names = [binding.request, ...Object.values(binding.responses ?? {}).map((entry) => entry?.typeName)].filter(
        (name): name is string => Boolean(name)
      );
      for (const name of names) {
        expect(name in typeSchemas, `TYPE_BINDINGS names unknown type "${name}"`).toBe(true);
      }
    }
  });

  it('binds the PUT /orders/:id/status response but deliberately not its request', () => {
    // The handler does `const { status } = req.body;` with no type
    // annotation (see server.ts) - nothing ties that field to a named
    // interface, so this binding must not claim one either.
    const binding = TYPE_BINDINGS.find((entry) => entry.method === 'PUT' && entry.expressPath === '/orders/:id/status');
    expect(binding?.request).toBeUndefined();
    expect(binding?.responses?.[200]?.typeName).toBe('Order');
  });
});

describe('buildDocument', () => {
  it('emits an array response schema wrapping the named type for GET /orders', () => {
    const operations = new Map();
    operations.set('GET /orders', {
      method: 'GET',
      expressPath: '/orders',
      pathTemplate: '/orders',
      pathParamNames: [],
      querySamples: [{}],
      requestBodySamples: [],
      responsesByStatus: new Map([[200, [[]]]])
    });

    const doc = buildDocument(operations, ['GET /orders'], { title: 'Test', description: 'test doc' }) as {
      paths: Record<
        string,
        Record<string, { responses: Record<string, { content: { 'application/json': { schema: { type: string; 'x-schema-source': string } } } }> }>
      >;
    };

    const schema = doc.paths['/orders'].get.responses['200'].content['application/json'].schema;
    expect(schema.type).toBe('array');
    expect(schema['x-schema-source']).toBe('typescript-type:Order[]');
  });
});
