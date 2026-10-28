using Microsoft.AspNetCore.Mvc;
using CustomerService.Models;
using CustomerService.Services;

namespace CustomerService.Controllers;

/// <summary>
/// Operator management API controller.
///
/// A shop operator and a shopper are two different people in two different
/// bounded contexts, so an operator is its own collection rather than a
/// `role` flag on <see cref="Customer"/> - served alongside customers by this
/// same service, at a clearly named resource of its own.
///
/// An operator signs in here (POST /operators/sign-in) and the back office is
/// closed until they do. That is authentication only: no endpoint on this
/// service checks a token before answering, so an operator session says who is
/// asking and never what they are allowed to do.
/// </summary>
[ApiController]
[Route("[controller]")]
[Produces("application/json")]
public class OperatorsController : ControllerBase
{
    private readonly IOperatorService _operatorService;
    private readonly ISessionStore _sessions;
    private readonly ILogger<OperatorsController> _logger;

    public OperatorsController(IOperatorService operatorService, ISessionStore sessions, ILogger<OperatorsController> logger)
    {
        _operatorService = operatorService ?? throw new ArgumentNullException(nameof(operatorService));
        _sessions = sessions ?? throw new ArgumentNullException(nameof(sessions));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    // Same refusal wording as the customer side, for the same reason: it does not
    // say which half was wrong.
    private const string RefusedMessage = "Login or password is incorrect";

    /// <summary>Sign an operator in</summary>
    /// <param name="request">The operator's login and password</param>
    /// <returns>A session token and the signed-in operator</returns>
    /// <response code="200">Signed in; the body carries the session token</response>
    /// <response code="400">Request body failed validation</response>
    /// <response code="401">The login and password were not accepted</response>
    [HttpPost("sign-in")]
    [ProducesResponseType(typeof(OperatorSession), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<OperatorSession>> SignInOperator(SignInRequest request)
    {
        _logger.LogInformation("Operator sign-in attempt for login: {Login}", request.Login);

        var matched = await _operatorService.AuthenticateOperatorAsync(request.Login, request.Password);

        if (matched == null)
        {
            _logger.LogInformation("Operator sign-in refused for login: {Login}", request.Login);
            return Unauthorized(new { error = RefusedMessage });
        }

        var token = _sessions.Issue("operator", matched.Id);

        _logger.LogInformation("Operator signed in: {OperatorId}", matched.Id);
        return Ok(new OperatorSession { Token = token, Operator = matched });
    }

    /// <summary>Read the operator behind a session token</summary>
    /// <returns>The signed-in operator</returns>
    /// <response code="200">The token resolved to an operator</response>
    /// <response code="401">No Authorization: Bearer token, or the token is not live</response>
    [HttpGet("session")]
    [ProducesResponseType(typeof(Operator), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<Operator>> GetSession()
    {
        var principal = _sessions.Resolve(BearerToken.From(Request));

        if (principal == null || principal.Kind != "operator")
        {
            return Unauthorized(new { error = "No live operator session" });
        }

        var matched = await _operatorService.GetOperatorByIdAsync(principal.Id);

        if (matched == null)
        {
            _sessions.Revoke(BearerToken.From(Request));
            return Unauthorized(new { error = "No live operator session" });
        }

        return Ok(matched);
    }

    /// <summary>Sign an operator out, revoking their session token</summary>
    /// <response code="204">The token was revoked, or was already unknown</response>
    [HttpDelete("session")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public IActionResult SignOutOperator()
    {
        var revoked = _sessions.Revoke(BearerToken.From(Request));
        _logger.LogInformation("Operator sign-out: token revoked = {Revoked}", revoked);
        return NoContent();
    }

    /// <summary>Get operator by ID</summary>
    /// <param name="id">Operator identifier</param>
    /// <returns>Operator details if found</returns>
    /// <response code="200">Operator found and returned</response>
    /// <response code="404">Operator not found</response>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(Operator), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Operator>> GetOperatorById(string id)
    {
        _logger.LogInformation("Getting operator with ID: {OperatorId}", id);

        if (string.IsNullOrWhiteSpace(id))
        {
            _logger.LogWarning("Invalid operator ID provided: {OperatorId}", id);
            return BadRequest("Operator ID cannot be empty");
        }

        var existingOperator = await _operatorService.GetOperatorByIdAsync(id);

        if (existingOperator == null)
        {
            _logger.LogInformation("Operator not found with ID: {OperatorId}", id);
            return NotFound($"Operator with ID '{id}' not found");
        }

        _logger.LogInformation("Successfully retrieved operator: {OperatorId}", existingOperator.Id);
        return Ok(existingOperator);
    }

    /// <summary>Get all active operators</summary>
    /// <returns>List of all active operators</returns>
    /// <response code="200">Operators found and returned</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<Operator>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<Operator>>> GetAllOperators()
    {
        _logger.LogInformation("Getting all active operators");

        var operators = await _operatorService.GetAllOperatorsAsync();

        _logger.LogInformation("Successfully retrieved {OperatorCount} active operators", operators.Count);

        return Ok(operators);
    }

    /// <summary>Add a new operator</summary>
    /// <param name="request">New operator details</param>
    /// <returns>The created operator</returns>
    /// <response code="201">Operator created</response>
    /// <response code="400">Request body failed validation</response>
    [HttpPost]
    [ProducesResponseType(typeof(Operator), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Operator>> CreateOperator(CreateOperatorRequest request)
    {
        _logger.LogInformation("Creating operator: {OperatorName}", request.Name);

        var createdOperator = await _operatorService.CreateOperatorAsync(request);

        _logger.LogInformation("Successfully created operator: {OperatorId}", createdOperator.Id);

        return CreatedAtAction(nameof(GetOperatorById), new { id = createdOperator.Id }, createdOperator);
    }

    /// <summary>Update an existing operator's details</summary>
    /// <param name="id">Operator identifier</param>
    /// <param name="request">Updated operator details</param>
    /// <returns>The updated operator</returns>
    /// <response code="200">Operator updated and returned</response>
    /// <response code="400">Request body failed validation, or the operator ID was empty</response>
    /// <response code="404">Operator not found</response>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(Operator), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Operator>> UpdateOperator(string id, UpdateOperatorRequest request)
    {
        _logger.LogInformation("Updating operator with ID: {OperatorId}", id);

        if (string.IsNullOrWhiteSpace(id))
        {
            _logger.LogWarning("Invalid operator ID provided: {OperatorId}", id);
            return BadRequest("Operator ID cannot be empty");
        }

        var updatedOperator = await _operatorService.UpdateOperatorAsync(id, request);

        if (updatedOperator == null)
        {
            _logger.LogInformation("Operator not found with ID: {OperatorId}", id);
            return NotFound($"Operator with ID '{id}' not found");
        }

        _logger.LogInformation("Successfully updated operator: {OperatorId}", updatedOperator.Id);
        return Ok(updatedOperator);
    }

    /// <summary>Delete an operator</summary>
    /// <param name="id">Operator identifier</param>
    /// <response code="204">Operator deleted</response>
    /// <response code="400">The operator ID was empty</response>
    /// <response code="404">Operator not found</response>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteOperator(string id)
    {
        _logger.LogInformation("Deleting operator with ID: {OperatorId}", id);

        if (string.IsNullOrWhiteSpace(id))
        {
            _logger.LogWarning("Invalid operator ID provided: {OperatorId}", id);
            return BadRequest("Operator ID cannot be empty");
        }

        var deleted = await _operatorService.DeleteOperatorAsync(id);

        if (!deleted)
        {
            _logger.LogInformation("Operator not found with ID: {OperatorId}", id);
            return NotFound($"Operator with ID '{id}' not found");
        }

        _logger.LogInformation("Successfully deleted operator: {OperatorId}", id);
        return NoContent();
    }
}
