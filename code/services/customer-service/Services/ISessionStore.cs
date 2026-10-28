using CustomerService.Models;

namespace CustomerService.Services;

/// <summary>Issues, resolves and revokes the opaque session tokens both front ends hold</summary>
public interface ISessionStore
{
    /// <summary>Issue a fresh token for a principal</summary>
    /// <param name="kind">"customer" or "operator"</param>
    /// <param name="id">The customer or operator identifier</param>
    /// <returns>The opaque token the caller sends back as a bearer credential</returns>
    string Issue(string kind, string id);

    /// <summary>Resolve a bearer token to the principal it was issued for</summary>
    /// <param name="token">An opaque token previously returned by Issue</param>
    /// <returns>The principal if the token is live, null otherwise</returns>
    SessionPrincipal? Resolve(string? token);

    /// <summary>Revoke a token, so the same string never resolves again</summary>
    /// <param name="token">An opaque token</param>
    /// <returns>True if a live session was revoked, false if the token was unknown</returns>
    bool Revoke(string? token);
}
