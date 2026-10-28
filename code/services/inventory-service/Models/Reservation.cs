namespace InventoryService.Models;

/// <summary>
/// A hold placed on stock for one order line.
/// Mirrors service design  (Reservation) / .
/// Valid <see cref="Status"/> values: active, fulfilled, released, expired
/// ( states; initial state is "active").
/// </summary>
public class Reservation
{
    public Guid ReservationId { get; set; }

    public string ProductSku { get; set; } = string.Empty;

    public int Quantity { get; set; }

    public Guid OrderId { get; set; }

    public string Status { get; set; } = "active";

    /// <summary>
    /// A hold expires rather than lasting forever . No operation
    /// in the model enforces the expiry yet - see the inventory-service README
    /// "What the model asked for that was not built".
    /// </summary>
    public DateTime ExpiresAt { get; set; }
}
