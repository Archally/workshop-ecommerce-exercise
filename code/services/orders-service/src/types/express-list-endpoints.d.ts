// express-list-endpoints ships no types of its own and this project does not
// want the @types/express-list-endpoints devDependency (it tracks a newer
// major of the library) just for a two-field return shape - so it's a small
// ambient declaration, hand-written against the v3.0.1 API actually used.
declare module 'express-list-endpoints' {
  import type { Express, Router } from 'express';

  interface Endpoint {
    path: string;
    methods: string[];
    middlewares?: string[];
  }

  export default function expressListEndpoints(app: Express | Router): Endpoint[];
}
