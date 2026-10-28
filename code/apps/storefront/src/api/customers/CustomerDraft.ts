// The six postal fields are optional because customer-service accepts a
// registration without them (CreateCustomerRequest.cs) - a customer is known by
// a name and a login before they are known by an address.
export interface CustomerDraft {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}
