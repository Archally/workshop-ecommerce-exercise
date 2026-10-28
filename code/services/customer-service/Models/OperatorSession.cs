namespace CustomerService.Models;

/// <summary>A signed-in operator: the session token to send back, and who it belongs to</summary>
public class OperatorSession
{
    /// <summary>Opaque session token, sent on later requests as "Authorization: Bearer &lt;token&gt;"</summary>
    public string Token { get; set; } = string.Empty;

    /// <summary>The operator the token was issued for</summary>
    public Operator Operator { get; set; } = new();
}
