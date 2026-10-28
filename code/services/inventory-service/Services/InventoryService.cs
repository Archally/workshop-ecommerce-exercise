using InventoryService.Models;

namespace InventoryService.Services;

/// <summary>
/// Inventory service implementation with sample stock, seeded from the same
/// SKUs and quantities products-service already serves (services/products-service/src/catalog/productCatalog.ts)
/// so a local can check and reserve stock for a product the storefront shows.
/// UBL-005 (Laptop) starts at 3 units on purpose - the same "near out-of-stock"
/// seed products-service uses to make Insufficient Stock reachable in a local.
/// </summary>
public class InventoryServiceImplementation : IInventoryService
{
    private static readonly object _lock = new();

    private static readonly Dictionary<string, StockLevel> _stock = new()
    {
        ["WBH-001"] = new StockLevel { ProductSku = "WBH-001", Available = 45, Reserved = 0, Total = 45 },
        ["EOC-002"] = new StockLevel { ProductSku = "EOC-002", Available = 12, Reserved = 0, Total = 12 },
        ["SSWB-003"] = new StockLevel { ProductSku = "SSWB-003", Available = 78, Reserved = 0, Total = 78 },
        ["OCT-004"] = new StockLevel { ProductSku = "OCT-004", Available = 156, Reserved = 0, Total = 156 },
        ["UBL-005"] = new StockLevel { ProductSku = "UBL-005", Available = 3, Reserved = 0, Total = 3 },
        ["MKB-006"] = new StockLevel { ProductSku = "MKB-006", Available = 60, Reserved = 0, Total = 60 },
        ["MON-007"] = new StockLevel { ProductSku = "MON-007", Available = 24, Reserved = 0, Total = 24 },
        ["ASD-008"] = new StockLevel { ProductSku = "ASD-008", Available = 8, Reserved = 0, Total = 8 },
        ["PYM-009"] = new StockLevel { ProductSku = "PYM-009", Available = 500, Reserved = 0, Total = 500 },
        ["THU-010"] = new StockLevel { ProductSku = "THU-010", Available = 90, Reserved = 0, Total = 90 },
    };

    private static readonly List<Reservation> _reservations = new();

    // No operation in the model enforces this window yet (, )
    // - fifteen minutes is this implementation's own placeholder, not a modelled value.
    private static readonly TimeSpan ReservationWindow = TimeSpan.FromMinutes(15);

    /// <summary>Reserve quantity for an order line</summary>
    public async Task<ReserveStockOutcome> ReserveStockAsync(ReserveStockRequest request)
    {
        await Task.Delay(10); // Simulate async operation

        lock (_lock)
        {
            var level = _stock.TryGetValue(request.ProductSku, out var existing)
                ? existing
                : new StockLevel { ProductSku = request.ProductSku, Available = 0, Reserved = 0, Total = 0 };

            if (level.Available < request.Quantity)
            {
                return new ReserveStockOutcome(Reserved: false, Reservation: null, Available: level.Available);
            }

            level.Available -= request.Quantity;
            level.Reserved += request.Quantity;
            _stock[request.ProductSku] = level;

            var reservation = new Reservation
            {
                ReservationId = Guid.NewGuid(),
                ProductSku = request.ProductSku,
                Quantity = request.Quantity,
                OrderId = request.OrderId,
                Status = "active",
                ExpiresAt = DateTime.UtcNow.Add(ReservationWindow),
            };
            _reservations.Add(reservation);

            return new ReserveStockOutcome(Reserved: true, Reservation: reservation, Available: level.Available);
        }
    }

    /// <summary>Check available stock for a product</summary>
    public async Task<StockLevel> GetStockLevelAsync(string productSku)
    {
        await Task.Delay(10); // Simulate async operation

        lock (_lock)
        {
            if (_stock.TryGetValue(productSku, out var level))
            {
                // Return a copy - callers must not be able to mutate warehouse state
                // through the read model.
                return new StockLevel
                {
                    ProductSku = level.ProductSku,
                    Available = level.Available,
                    Reserved = level.Reserved,
                    Total = level.Total,
                };
            }

            return new StockLevel { ProductSku = productSku, Available = 0, Reserved = 0, Total = 0 };
        }
    }
}
