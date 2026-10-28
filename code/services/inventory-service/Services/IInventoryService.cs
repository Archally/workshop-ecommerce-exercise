using InventoryService.Models;

namespace InventoryService.Services;

/// <summary>
/// Outcome of a reserve attempt: exactly one of <see cref="Reservation"/> or
/// <see cref="Available"/>-as-shortfall is meaningful, selected by <see cref="Reserved"/>.
/// </summary>
public record ReserveStockOutcome(bool Reserved, Reservation? Reservation, int Available);

/// <summary>
/// Interface for inventory service operations.
/// Covers  (Reserve Stock) and  (Check Stock) -
/// the two operations 's OpenAPI contract exposes.
/// </summary>
public interface IInventoryService
{
    /// <summary>
    /// Reserve quantity for an order line . Moves the requested
    /// quantity from available to reserved and creates the hold (,
    /// ), or reports the shortfall if there is not enough available.
    /// </summary>
    Task<ReserveStockOutcome> ReserveStockAsync(ReserveStockRequest request);

    /// <summary>
    /// Check available stock for a product . A SKU this warehouse
    /// has never stocked reads as zero on every count, rather than a 404 - the model
    /// declares only a 200 response for this operation.
    /// </summary>
    Task<StockLevel> GetStockLevelAsync(string productSku);
}
