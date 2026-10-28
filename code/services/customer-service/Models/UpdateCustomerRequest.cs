using System.ComponentModel.DataAnnotations;

namespace CustomerService.Models;

// The same six fields as CreateCustomerRequest, in the same `string?` shape and
// for the reason stated there. Create and update agree deliberately: a profile
// saved before the postal details arrive would otherwise be rejected on every
// save, so the account page could never be the place the rest arrives.
/// <summary>
/// Details a customer submits to update their own profile. The postal details
/// are optional, so a profile can be saved one field at a time.
/// </summary>
public class UpdateCustomerRequest
{
    /// <summary>Customer name</summary>
    [Required]
    public string Name { get; set; } = string.Empty;

    /// <summary>Customer email, which is also the login this customer signs in with</summary>
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    /// <summary>Customer phone, optional</summary>
    public string? Phone { get; set; }

    /// <summary>Customer address, optional</summary>
    public string? Address { get; set; }

    /// <summary>Customer city, optional</summary>
    public string? City { get; set; }

    /// <summary>Customer state, optional</summary>
    public string? State { get; set; }

    /// <summary>Customer zip code, optional</summary>
    public string? Zip { get; set; }

    /// <summary>Customer country, optional</summary>
    public string? Country { get; set; }
}
