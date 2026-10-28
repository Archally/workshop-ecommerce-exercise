using CustomerService.Models;

namespace CustomerService.Services;

/// <summary>Interface for customer service operations</summary>
public interface ICustomerService
{
    /// <summary>Get customer by ID</summary>
    /// <param name="customerId">Customer identifier</param>
    /// <returns>Customer if found, null otherwise</returns>
    Task<Customer?> GetCustomerByIdAsync(string customerId);

    /// <summary>Get customer discounts</summary>
    /// <param name="customerId">Customer identifier</param>
    /// <returns>List of applicable discounts</returns>
    Task<List<Discount>> GetCustomerDiscountsAsync(string customerId);

    /// <summary>Get all customers</summary>
    /// <returns>List of all customers</returns>
    Task<List<Customer>> GetAllCustomersAsync();

    /// <summary>Authenticate a customer by login and password</summary>
    /// <param name="login">The customer's login, which is their email address</param>
    /// <param name="password">The customer's password</param>
    /// <returns>The customer if the pair matches an active account, null otherwise</returns>
    Task<Customer?> AuthenticateCustomerAsync(string login, string password);

    /// <summary>Register a new customer</summary>
    /// <param name="request">New customer details</param>
    /// <returns>The created customer</returns>
    Task<Customer> CreateCustomerAsync(CreateCustomerRequest request);

    /// <summary>Update an existing customer's details</summary>
    /// <param name="customerId">Customer identifier</param>
    /// <param name="request">Updated customer details</param>
    /// <returns>The updated customer if found, null otherwise</returns>
    Task<Customer?> UpdateCustomerAsync(string customerId, UpdateCustomerRequest request);

    /// <summary>Delete a customer</summary>
    /// <param name="customerId">Customer identifier</param>
    /// <returns>True if the customer was found and deleted, false otherwise</returns>
    Task<bool> DeleteCustomerAsync(string customerId);
}
