using System.ComponentModel.DataAnnotations;

namespace CustomerService.Models;

/// <summary>Request for product pricing with customer-specific discounts</summary>
public class CustomerDiscountsRequest
{
    /// <summary>Customer identifier</summary>
    [Required]
    public string CustomerId { get; set; } = string.Empty;
}
