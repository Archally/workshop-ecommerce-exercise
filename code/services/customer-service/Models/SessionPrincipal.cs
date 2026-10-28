namespace CustomerService.Models;

/// <summary>Who a session token belongs to: a customer or a shop operator, and which record</summary>
public class SessionPrincipal
{
    /// <summary>Either "customer" or "operator"</summary>
    public string Kind { get; set; } = string.Empty;

    /// <summary>Identifier of the customer or operator record the token was issued for</summary>
    public string Id { get; set; } = string.Empty;
}
