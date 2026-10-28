// customer-service's Customer is a flat record (Address/City/State/Zip/Country
// are separate scalar fields on the .NET model, not a nested object).
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isActive: boolean;
}
