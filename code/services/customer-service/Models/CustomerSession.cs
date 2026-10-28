namespace CustomerService.Models;

/// <summary>A signed-in shopper: the session token to send back, and who it belongs to</summary>
public class CustomerSession
{
    /// <summary>Opaque session token, sent on later requests as "Authorization: Bearer &lt;token&gt;"</summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>The customer the token was issued for</summary>
    public Customer Customer { get; set; } = new();
}
