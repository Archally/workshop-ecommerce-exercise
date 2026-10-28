using System.ComponentModel.DataAnnotations;

namespace CustomerService.Models;

/// <summary>Response with customer discounts</summary>
public class CustomerDiscountsResponse
{
    /// <summary>Customer identifier</summary>
    [Required]
    public string CustomerId { get; set; } = string.Empty;

    /// <summary>Applied discounts</summary>
    [Required]
    public List<Discount> Discounts { get; set; } = new();
}
