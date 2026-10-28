using System.ComponentModel.DataAnnotations;

namespace CustomerService.Models;

/// <summary>Discount information</summary>
public class Discount
{
    /// <summary>Type of discount applied</summary>
    [Required]
    public string Type { get; set; } = string.Empty;

    /// <summary>Discount amount</summary>
    [Required]
    [Range(0, double.MaxValue, ErrorMessage = "Amount must be non-negative")]
    public decimal Amount { get; set; }

    /// <summary>Discount percentage (optional)</summary>
    [Range(0, 100, ErrorMessage = "Percentage must be between 0 and 100")]
    public decimal? Percentage { get; set; }

    /// <summary>Description of the discount</summary>
    public string? Description { get; set; }
}
