using Microsoft.AspNetCore.Mvc;
using CustomerService.Models;
using CustomerService.Services;

namespace CustomerService.Controllers;

/// <summary>Customer management API controller</summary>
[ApiController]
[Route("[controller]")]
[Produces("application/json")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;
    private readonly ISessionStore _sessions;
    private readonly ILogger<CustomersController> _logger;

    public CustomersController(ICustomerService customerService, ISessionStore sessions, ILogger<CustomersController> logger)
    {
        _customerService = customerService ?? throw new ArgumentNullException(nameof(customerService));
        _sessions = sessions ?? throw new ArgumentNullException(nameof(sessions));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    // A refusal never says which half was wrong: the same body answers an unknown
    // login and a wrong password, so the endpoint cannot be used to find out
    // which logins exist.
    private const string RefusedMessage = "Login or password is incorrect";

    /// <summary>Sign a customer in</summary>
    /// <param name="request">The customer's login and password</param>
    /// <returns>A session token and the signed-in customer</returns>
    /// <response code="200">Signed in; the body carries the session token</response>
    /// <response code="400">Request body failed validation</response>
    /// <response code="401">The login and password were not accepted</response>
    [HttpPost("sign-in")]
    [ProducesResponseType(typeof(CustomerSession), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CustomerSession>> SignInCustomer(SignInRequest request)
    {
        _logger.LogInformation("Customer sign-in attempt for login: {Login}", request.Login);

        var customer = await _customerService.AuthenticateCustomerAsync(request.Login, request.Password);

        if (customer == null)
        {
            _logger.LogInformation("Customer sign-in refused for login: {Login}", request.Login);
            return Unauthorized(new { error = RefusedMessage });
        }

        var token = _sessions.Issue("customer", customer.Id);

        _logger.LogInformation("Customer signed in: {CustomerId}", customer.Id);
        return Ok(new CustomerSession { Token = token, Customer = customer });
    }

    /// <summary>Read the customer behind a session token</summary>
    /// <returns>The signed-in customer</returns>
    /// <response code="200">The token resolved to a customer</response>
    /// <response code="401">No Authorization: Bearer token, or the token is not live</response>
    [HttpGet("session")]
    [ProducesResponseType(typeof(Customer), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<Customer>> GetSession()
    {
        var principal = _sessions.Resolve(BearerToken.From(Request));

        if (principal == null || principal.Kind != "customer")
        {
            return Unauthorized(new { error = "No live customer session" });
        }

        var customer = await _customerService.GetCustomerByIdAsync(principal.Id);

        if (customer == null)
        {
            _sessions.Revoke(BearerToken.From(Request));
            return Unauthorized(new { error = "No live customer session" });
        }

        return Ok(customer);
    }

    /// <summary>Sign a customer out, revoking their session token</summary>
    /// <response code="204">The token was revoked, or was already unknown</response>
    [HttpDelete("session")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public IActionResult SignOutCustomer()
    {
        var revoked = _sessions.Revoke(BearerToken.From(Request));
        _logger.LogInformation("Customer sign-out: token revoked = {Revoked}", revoked);
        return NoContent();
    }

    /// <summary>Get customer by ID</summary>
    /// <param name="id">Customer identifier</param>
    /// <returns>Customer details if found</returns>
    /// <response code="200">Customer found and returned</response>
    /// <response code="404">Customer not found</response>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(Customer), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Customer>> GetCustomerById(string id)
    {
        _logger.LogInformation("Getting customer with ID: {CustomerId}", id);

        if (string.IsNullOrWhiteSpace(id))
        {
            _logger.LogWarning("Invalid customer ID provided: {CustomerId}", id);
            return BadRequest("Customer ID cannot be empty");
        }

        var customer = await _customerService.GetCustomerByIdAsync(id);
        
        if (customer == null)
        {
            _logger.LogInformation("Customer not found with ID: {CustomerId}", id);
            return NotFound($"Customer with ID '{id}' not found");
        }

        _logger.LogInformation("Successfully retrieved customer: {CustomerId}", customer.Id);
        return Ok(customer);
    }

    /// <summary>Get customer discounts</summary>
    /// <param name="id">Customer identifier</param>
    /// <returns>List of applicable customer discounts</returns>
    /// <response code="200">Discounts found and returned</response>
    /// <response code="404">Customer not found</response>
    [HttpGet("{id}/discounts")]
    [ProducesResponseType(typeof(CustomerDiscountsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CustomerDiscountsResponse>> GetCustomerDiscounts(string id)
    {
        _logger.LogInformation("Getting discounts for customer with ID: {CustomerId}", id);

        if (string.IsNullOrWhiteSpace(id))
        {
            _logger.LogWarning("Invalid customer ID provided: {CustomerId}", id);
            return BadRequest("Customer ID cannot be empty");
        }

        var customer = await _customerService.GetCustomerByIdAsync(id);
        if (customer == null)
        {
            _logger.LogInformation("Customer not found with ID: {CustomerId}", id);
            return NotFound($"Customer with ID '{id}' not found");
        }

        var discounts = await _customerService.GetCustomerDiscountsAsync(id);
        
        var response = new CustomerDiscountsResponse
        {
            CustomerId = id,
            Discounts = discounts
        };

        _logger.LogInformation("Successfully retrieved {DiscountCount} discounts for customer: {CustomerId}", 
            discounts.Count, id);
        
        return Ok(response);
    }

    /// <summary>Get all active customers</summary>
    /// <returns>List of all active customers</returns>
    /// <response code="200">Customers found and returned</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<Customer>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<Customer>>> GetAllCustomers()
    {
        _logger.LogInformation("Getting all active customers");

        var customers = await _customerService.GetAllCustomersAsync();

        _logger.LogInformation("Successfully retrieved {CustomerCount} active customers", customers.Count);

        return Ok(customers);
    }

    /// <summary>Register a new customer</summary>
    /// <param name="request">New customer details</param>
    /// <returns>The created customer</returns>
    /// <response code="201">Customer created</response>
    /// <response code="400">Request body failed validation</response>
    [HttpPost]
    [ProducesResponseType(typeof(Customer), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Customer>> CreateCustomer(CreateCustomerRequest request)
    {
        _logger.LogInformation("Creating customer: {CustomerName}", request.Name);

        var customer = await _customerService.CreateCustomerAsync(request);

        _logger.LogInformation("Successfully created customer: {CustomerId}", customer.Id);

        return CreatedAtAction(nameof(GetCustomerById), new { id = customer.Id }, customer);
    }

    /// <summary>Update an existing customer's details</summary>
    /// <param name="id">Customer identifier</param>
    /// <param name="request">Updated customer details</param>
    /// <returns>The updated customer</returns>
    /// <response code="200">Customer updated and returned</response>
    /// <response code="400">Request body failed validation, or the customer ID was empty</response>
    /// <response code="404">Customer not found</response>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(Customer), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Customer>> UpdateCustomer(string id, UpdateCustomerRequest request)
    {
        _logger.LogInformation("Updating customer with ID: {CustomerId}", id);

        if (string.IsNullOrWhiteSpace(id))
        {
            _logger.LogWarning("Invalid customer ID provided: {CustomerId}", id);
            return BadRequest("Customer ID cannot be empty");
        }

        var customer = await _customerService.UpdateCustomerAsync(id, request);

        if (customer == null)
        {
            _logger.LogInformation("Customer not found with ID: {CustomerId}", id);
            return NotFound($"Customer with ID '{id}' not found");
        }

        _logger.LogInformation("Successfully updated customer: {CustomerId}", customer.Id);
        return Ok(customer);
    }

    /// <summary>Delete a customer</summary>
    /// <param name="id">Customer identifier</param>
    /// <response code="204">Customer deleted</response>
    /// <response code="400">The customer ID was empty</response>
    /// <response code="404">Customer not found</response>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteCustomer(string id)
    {
        _logger.LogInformation("Deleting customer with ID: {CustomerId}", id);

        if (string.IsNullOrWhiteSpace(id))
        {
            _logger.LogWarning("Invalid customer ID provided: {CustomerId}", id);
            return BadRequest("Customer ID cannot be empty");
        }

        var deleted = await _customerService.DeleteCustomerAsync(id);

        if (!deleted)
        {
            _logger.LogInformation("Customer not found with ID: {CustomerId}", id);
            return NotFound($"Customer with ID '{id}' not found");
        }

        _logger.LogInformation("Successfully deleted customer: {CustomerId}", id);
        return NoContent();
    }
}
