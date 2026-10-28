namespace InventoryService.Models;

/// <summary>
/// 409 body for a reservation the warehouse cannot cover.
/// Mirrors service design  (Insufficient Stock, retry_eligible: true).
/// </summary>
public class InsufficientStockResponse
{
    public string Error { get; set; } = "insufficient-stock";

    public string ProductSku { get; set; } = string.Empty;

    public int Requested { get; set; }

    public int Available { get; set; }

    public bool RetryEligible { get; set; } = true;
}
