using System.ComponentModel.DataAnnotations;

namespace InventoryService.Models;

/// <summary>
/// Request to reserve stock for an order line.
/// Mirrors service design  /  (ReserveStockRequest).
/// </summary>
public class ReserveStockRequest
{
    /// <summary>Product SKU to reserve</summary>
    [Required]
    [RegularExpression("^[A-Z0-9-]{3,20}$")]
    public string ProductSku { get; set; } = string.Empty;

    /// <summary>Number of units to reserve</summary>
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    /// <summary>Order that requires this reservation</summary>
    [Required]
    public Guid OrderId { get; set; }
}
