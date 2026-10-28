// A 404 is a plain-text body from ASP.NET's NotFound(string) on customer-service,
// or a JSON { error } from the two Node services - both are normalized by the
// api client into ApiError before a page ever sees them.
export interface ApiFieldErrors {
  [field: string]: string[];
}
