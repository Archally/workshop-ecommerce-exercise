namespace InventoryService.Models;

/// <summary>
/// Current stock level for a product.
/// Mirrors service design  (StockLevel) / .
/// </summary>
public class StockLevel
{
    public string ProductSku { get; set; } = string.Empty;

    /// <summary>Units available for sale (total minus reserved)</summary>
    public int Available { get; set; }

    /// <summary>Units reserved by pending orders</summary>
    public int Reserved { get; set; }

    /// <summary>Total units in warehouse</summary>
    public int Total { get; set; }
}
