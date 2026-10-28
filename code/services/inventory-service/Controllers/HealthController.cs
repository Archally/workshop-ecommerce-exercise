using Microsoft.AspNetCore.Mvc;

namespace InventoryService.Controllers;

/// <summary>Health check controller</summary>
[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    private readonly ILogger<HealthController> _logger;

    public HealthController(ILogger<HealthController> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>Health check endpoint</summary>
    /// <returns>Health status</returns>
    /// <response code="200">Service is healthy</response>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult GetHealth()
    {
        _logger.LogInformation("Health check requested");

        var healthStatus = new
        {
            status = "healthy",
            service = "inventory-service",
            timestamp = DateTime.UtcNow,
            version = "1.0.0"
        };

        return Ok(healthStatus);
    }
}
