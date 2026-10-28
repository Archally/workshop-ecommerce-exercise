using System.ComponentModel.DataAnnotations;

namespace CustomerService.Models;

// Phone through Country are `string?`, not `string` with [Required] dropped.
// Measured on this project (net10.0, Nullable=enable): the binder accepts an
// absent field under either shape, so the attribute alone decides it here - but
// only `string?` states in the TYPE that the value may be absent, and only
// `string?` stays optional if the implicit-required rule for non-nullable
// reference types ever applies.
/// <summary>
/// Details a customer submits to register themselves. A registration needs a
/// name, an email - which is also the login - and a password; the postal
/// details are optional and are filled in later on the account page.
/// </summary>
public class CreateCustomerRequest
{
    /// <summary>Customer name</summary>
    [Required]
    public string Name { get; set; } = string.Empty;

    /// <summary>Customer email, which is also the login this customer signs in with</summary>
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    /// <summary>Password this customer will sign in with. Stored hashed, never in clear</summary>
    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;

    /// <summary>Customer phone, optional at registration</summary>
    public string? Phone { get; set; }

    /// <summary>Customer address, optional at registration</summary>
    public string? Address { get; set; }

    /// <summary>Customer city, optional at registration</summary>
    public string? City { get; set; }

    /// <summary>Customer state, optional at registration</summary>
    public string? State { get; set; }

    /// <summary>Customer zip code, optional at registration</summary>
    public string? Zip { get; set; }

    /// <summary>Customer country, optional at registration</summary>
    public string? Country { get; set; }
}
