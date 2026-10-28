using Microsoft.AspNetCore.Mvc;
using InventoryService.Models;
using InventoryService.Services;

namespace InventoryService.Controllers;

/// <summary>
/// Inventory API controller.
///
/// Implements  (Reserve Stock, POST /inventory/reserve) and
///  (Check Stock, GET /inventory/{sku}/stock) - the two
/// operations design 's OpenAPI contract (inventory-api) exposes.
///
/// 's asyncapi contract also declares Reserve Stock reacting to the
/// Orders event Order Submitted, and Stock Reserved being published back onto
/// the event bus. Neither is wired here - this repository has no messaging
/// dependency today, and adding one is a separate task. See this project's
/// README, "What the model asked for that was not built".
/// </summary>
[ApiController]
[Route("inventory")]
[Produces("application/json")]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;
    private readonly ILogger<InventoryController> _logger;

    public InventoryController(IInventoryService inventoryService, ILogger<InventoryController> logger)
    {
        _inventoryService = inventoryService ?? throw new ArgumentNullException(nameof(inventoryService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>Reserve stock for an order line </summary>
    /// <param name="request">SKU, quantity and the order that needs the hold</param>
    /// <returns>The created reservation, or 409 if the warehouse cannot cover it</returns>
    /// <response code="200">Stock reserved successfully</response>
    /// <response code="400">Request body failed validation</response>
    /// <response code="409">Insufficient stock (, retry eligible)</response>
    [HttpPost("reserve")]
    [ProducesResponseType(typeof(Reservation), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(InsufficientStockResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<Reservation>> ReserveStock(ReserveStockRequest request)
    {
        _logger.LogInformation(
            "Reserving {Quantity} of {ProductSku} for order {OrderId}",
            request.Quantity, request.ProductSku, request.OrderId);

        var outcome = await _inventoryService.ReserveStockAsync(request);

        if (!outcome.Reserved)
        {
            _logger.LogInformation(
                "Insufficient stock for {ProductSku}: requested {Requested}, available {Available}",
                request.ProductSku, request.Quantity, outcome.Available);

            return Conflict(new InsufficientStockResponse
            {
                Error = "insufficient-stock",
                ProductSku = request.ProductSku,
                Requested = request.Quantity,
                Available = outcome.Available,
                RetryEligible = true,
            });
        }

        _logger.LogInformation(
            "Reserved {ReservationId} for {ProductSku}", outcome.Reservation!.ReservationId, request.ProductSku);

        return Ok(outcome.Reservation);
    }

    /// <summary>Check available stock for a product </summary>
    /// <param name="sku">Product SKU</param>
    /// <returns>Current stock level</returns>
    /// <response code="200">Current stock level</response>
    [HttpGet("{sku}/stock")]
    [ProducesResponseType(typeof(StockLevel), StatusCodes.Status200OK)]
    public async Task<ActionResult<StockLevel>> CheckStock(string sku)
    {
        _logger.LogInformation("Checking stock for {ProductSku}", sku);

        var level = await _inventoryService.GetStockLevelAsync(sku);

        _logger.LogInformation(
            "{ProductSku}: {Available} available, {Reserved} reserved, {Total} total",
            level.ProductSku, level.Available, level.Reserved, level.Total);

        return Ok(level);
    }
}
