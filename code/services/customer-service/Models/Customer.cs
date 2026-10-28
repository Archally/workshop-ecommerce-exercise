using System.ComponentModel.DataAnnotations;

namespace CustomerService.Models;

/// <summary>Customer entity with full details</summary>
public class Customer
{
    /// <summary>Unique customer identifier</summary>
    [Required]
    public string Id { get; set; } = string.Empty;

    /// <summary>Customer name</summary>
    [Required]
    public string Name { get; set; } = string.Empty;

    /// <summary>Customer email</summary>
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    /// <summary>Customer phone</summary>
    [Required]
    public string Phone { get; set; } = string.Empty;

    /// <summary>Customer address</summary>
    [Required]
    public string Address { get; set; } = string.Empty;

    /// <summary>Customer city</summary>
    [Required]
    public string City { get; set; } = string.Empty;

    /// <summary>Customer state</summary>
    [Required]
    public string State { get; set; } = string.Empty;

    /// <summary>Customer zip code</summary>
    [Required]
    public string Zip { get; set; } = string.Empty;

    /// <summary>Customer country</summary>
    [Required]
    public string Country { get; set; } = string.Empty;

    /// <summary>Whether the customer is currently active</summary>
    [Required]
    public bool IsActive { get; set; } = true;
}
