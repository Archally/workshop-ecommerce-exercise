import { describe, expect, it } from 'vitest';
import { testables } from './openapi-capture';
import typeSchemas from './openapi-type-schemas.generated.json';

const { schemaFor, stampExamples, buildDocument, TYPE_BINDINGS } = testables;

describe('schemaFor (the observed-traffic fallback)', () => {
  it('marks a field required only when every sample carried it', () => {
    const schema = schemaFor([{ a: 1, b: 'x' }, { a: 2 }]) as { required?: string[]; properties: Record<string, { type: string }> };
    expect(schema.required).toEqual(['a']);
    expect(schema.properties.b.type).toBe('string');
  });

  it('flattens array items across every sample to build one item schema', () => {
    // Mirrors PriceResponse.discounts: one call's array has no `percentage`,
    // another's does - the item schema should show `percentage` as optional.
    const schema = schemaFor([[{ type: 'x', amount: 1 }], [{ type: 'y', amount: 2, percentage: 5 }]]) as {
      type: string;
      items: { required?: string[] };
    };
    expect(schema.type).toBe('array');
    expect(schema.items.required).toEqual(['type', 'amount']);
  });

  it('returns a bare string schema when nothing was ever observed', () => {
    expect(schemaFor([])).toEqual({ type: 'string' });
  });
});

describe('stampExamples', () => {
  it('stamps leaf examples from a real sample without mutating the source schema', () => {
    const typeSchema = {
      type: 'object',
      properties: { id: { type: 'string' }, stock: { type: 'number' } },
      required: ['id', 'stock']
    };
    const stamped = stampExamples(typeSchema, { id: '1', stock: 45 }) as {
      properties: Record<string, { example?: unknown }>;
    };
    expect(stamped.properties.id.example).toBe('1');
    expect(stamped.properties.stock.example).toBe(45);
    expect((typeSchema.properties.id as { example?: unknown }).example).toBeUndefined();
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
});

describe('buildDocument', () => {
  it('names a declared-but-unobserved route explicitly rather than only omitting it', () => {
    const operations = new Map();
    operations.set('GET /products', {
      method: 'GET',
      expressPath: '/products',
      pathTemplate: '/products',
      pathParamNames: [],
      querySamples: [],
      requestBodySamples: [],
      responsesByStatus: new Map([[200, [[]]]])
    });

    const doc = buildDocument(operations, ['GET /products', 'GET /products/:id'], {
      title: 'Test',
      description: 'test doc'
    }) as { paths: Record<string, unknown>; 'x-unobserved-declared-routes': string[] };

    expect(Object.keys(doc.paths)).toEqual(['/products']);
    expect(doc['x-unobserved-declared-routes']).toEqual(['GET /products/:id']);
  });

  it('marks a type-bound response with its type name and a traffic-only one as observed-traffic', () => {
    const operations = new Map();
    operations.set('GET /products/:id', {
      method: 'GET',
      expressPath: '/products/:id',
      pathTemplate: '/products/{id}',
      pathParamNames: ['id'],
      querySamples: [],
      requestBodySamples: [],
      responsesByStatus: new Map([[404, [{ error: 'Product not found' }]]])
    });

    const doc = buildDocument(operations, ['GET /products/:id'], { title: 'Test', description: 'test doc' }) as {
      paths: Record<string, Record<string, { responses: Record<string, { content: { 'application/json': { schema: { 'x-schema-source': string } } } }> }>>;
    };

    const schema = doc.paths['/products/{id}'].get.responses['404'].content['application/json'].schema;
    expect(schema['x-schema-source']).toBe('observed-traffic');
  });
});
