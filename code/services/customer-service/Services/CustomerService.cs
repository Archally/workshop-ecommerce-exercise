using CustomerService.Models;

namespace CustomerService.Services;

/// <summary>Customer service implementation with sample data</summary>
public class CustomerServiceImplementation : ICustomerService
{
    private static readonly List<Customer> _customers = new()
    {
        new Customer
        {
            Id = "customer-1",
            Name = "John Doe",
            Email = "john.doe@example.com",
            Phone = "123-456-7890",
            Address = "123 Main St",
            City = "Anytown",
            State = "CA",
            Zip = "12345",
            Country = "USA",
            IsActive = true
        },
        new Customer
        {
            Id = "customer-2",
            Name = "Jane Smith",
            Email = "jane.smith@example.com",
            Phone = "098-765-4321",
            Address = "456 Oak Ave",
            City = "Another City",
            State = "NY",
            Zip = "54321",
            Country = "USA",
            IsActive = true
        },
        new Customer
        {
            Id = "customer-3",
            Name = "Bob Johnson",
            Email = "bob.johnson@example.com",
            Phone = "555-123-4567",
            Address = "789 Pine Rd",
            City = "Third City",
            State = "TX",
            Zip = "67890",
            Country = "USA",
            IsActive = false
        },
        // customer-4 and customer-5 added 2026-09-20 for the 22 September
        // local checks (seed data brief): both active, one carries standing
        // discounts and one does not, so the order-pricing path can be shown
        // pricing the same product two different ways for two real customers.
        new Customer
        {
            Id = "customer-4",
            Name = "Maria Alvarez",
            Email = "maria.alvarez@example.com",
            Phone = "310-555-0142",
            Address = "22 Birch Lane",
            City = "Riverside",
            State = "CA",
            Zip = "92501",
            Country = "USA",
            IsActive = true
        },
        new Customer
        {
            Id = "customer-5",
            Name = "Tom Richards",
            Email = "tom.richards@example.com",
            Phone = "217-555-0198",
            Address = "88 Maple Court",
            City = "Springfield",
            State = "IL",
            Zip = "62704",
            Country = "USA",
            IsActive = true
        }
    };

    private static readonly Dictionary<string, List<Discount>> _customerDiscounts = new()
    {
        ["customer-1"] = new()
        {
            new Discount { Type = "loyalty", Amount = 5.0m, Percentage = 10.0m, Description = "Customer loyalty discount" },
            new Discount { Type = "bulk", Amount = 10.0m, Description = "Bulk purchase discount" }
        },
        ["customer-2"] = new()
        {
            new Discount { Type = "loyalty", Amount = 7.5m, Percentage = 15.0m, Description = "Premium customer loyalty discount" }
        },
        ["customer-3"] = new()
        {
            // Inactive customer - no discounts
        },
        ["customer-4"] = new()
        {
            new Discount { Type = "loyalty", Amount = 6.0m, Percentage = 12.0m, Description = "Loyalty programme discount" },
            new Discount { Type = "newsletter", Amount = 3.0m, Description = "Newsletter subscriber discount" }
        },
        ["customer-5"] = new()
        {
            // Active customer with no standing discount on file - the order-pricing
            // path prices this customer at full list, on purpose (seed data brief,
            // 2026-09-20).
        }
    };

    // Password hashes, keyed by customer id rather than by login, so changing a
    // customer's email on the account page moves their login without touching
    // this. The two seeded pairs are the local credentials and are
    // written down in the shop README; every other seeded customer has no
    // password and therefore cannot sign in.
    private static readonly Dictionary<string, string> _customerPasswords = new(StringComparer.Ordinal)
    {
        ["customer-1"] = PasswordHasher.Hash("shopper-demo-2026"),
        ["customer-4"] = PasswordHasher.Hash("shopper-demo-2026")
    };

    /// <summary>Get customer by ID</summary>
    public async Task<Customer?> GetCustomerByIdAsync(string customerId)
    {
        await Task.Delay(10); // Simulate async operation
        return _customers.FirstOrDefault(c => c.Id == customerId);
    }

    /// <summary>Get customer discounts</summary>
    public async Task<List<Discount>> GetCustomerDiscountsAsync(string customerId)
    {
        await Task.Delay(10); // Simulate async operation
        
        var customer = await GetCustomerByIdAsync(customerId);
        if (customer == null || !customer.IsActive)
        {
            return new List<Discount>();
        }

        return _customerDiscounts.TryGetValue(customerId, out var discounts) 
            ? discounts 
            : new List<Discount>();
    }

    /// <summary>Get all customers</summary>
    public async Task<List<Customer>> GetAllCustomersAsync()
    {
        await Task.Delay(10); // Simulate async operation
        return _customers.Where(c => c.IsActive).ToList();
    }

    /// <summary>Register a new customer</summary>
    public async Task<Customer> CreateCustomerAsync(CreateCustomerRequest request)
    {
        await Task.Delay(10); // Simulate async operation

        var customer = new Customer
        {
            Id = NextCustomerId(),
            Name = request.Name,
            Email = request.Email,
            Phone = request.Phone ?? string.Empty,
            Address = request.Address ?? string.Empty,
            City = request.City ?? string.Empty,
            State = request.State ?? string.Empty,
            Zip = request.Zip ?? string.Empty,
            Country = request.Country ?? string.Empty,
            IsActive = true
        };

        _customers.Add(customer);
        _customerDiscounts[customer.Id] = new List<Discount>();
        _customerPasswords[customer.Id] = PasswordHasher.Hash(request.Password);

        return customer;
    }

    /// <summary>Authenticate a customer by login and password</summary>
    public async Task<Customer?> AuthenticateCustomerAsync(string login, string password)
    {
        await Task.Delay(10); // Simulate async operation

        var customer = _customers.FirstOrDefault(c =>
            c.IsActive && string.Equals(c.Email, login, StringComparison.OrdinalIgnoreCase));

        if (customer == null || !_customerPasswords.TryGetValue(customer.Id, out var stored))
        {
            return null;
        }

        return PasswordHasher.Verify(password, stored) ? customer : null;
    }

    /// <summary>Update an existing customer's details</summary>
    public async Task<Customer?> UpdateCustomerAsync(string customerId, UpdateCustomerRequest request)
    {
        await Task.Delay(10); // Simulate async operation

        var customer = _customers.FirstOrDefault(c => c.Id == customerId);
        if (customer == null)
        {
            return null;
        }

        customer.Name = request.Name;
        customer.Email = request.Email;
        customer.Phone = request.Phone ?? string.Empty;
        customer.Address = request.Address ?? string.Empty;
        customer.City = request.City ?? string.Empty;
        customer.State = request.State ?? string.Empty;
        customer.Zip = request.Zip ?? string.Empty;
        customer.Country = request.Country ?? string.Empty;

        return customer;
    }

    /// <summary>Delete a customer</summary>
    public async Task<bool> DeleteCustomerAsync(string customerId)
    {
        await Task.Delay(10); // Simulate async operation

        var customer = _customers.FirstOrDefault(c => c.Id == customerId);
        if (customer == null)
        {
            return false;
        }

        _customers.Remove(customer);
        _customerDiscounts.Remove(customerId);
        _customerPasswords.Remove(customerId);

        return true;
    }

    /// <summary>
    /// Next free "customer-N" identifier, continuing the sample data's numbering
    /// scheme rather than switching newly created customers to a different id
    /// shape.
    /// </summary>
    private static string NextCustomerId()
    {
        const string prefix = "customer-";

        var highestIndex = _customers
            .Select(customer => customer.Id)
            .Where(id => id.StartsWith(prefix, StringComparison.Ordinal))
            .Select(id => int.TryParse(id[prefix.Length..], out var index) ? index : 0)
            .DefaultIfEmpty(0)
            .Max();

        return $"{prefix}{highestIndex + 1}";
    }
}
