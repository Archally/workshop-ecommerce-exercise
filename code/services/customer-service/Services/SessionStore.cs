using System.Collections.Concurrent;
using System.Security.Cryptography;
using CustomerService.Models;

namespace CustomerService.Services;

// What a session is in this shop, in one place, because both front ends have to
// agree on it: sign-in exchanges a login and a password for a 256-bit random
// opaque token, this service remembers token -> principal in process memory, and
// the caller sends the token back as `Authorization: Bearer <token>`. Sign-out
// revokes it here, so the string stops resolving for everyone at once.
//
// What it deliberately is NOT: not a JWT and not a claim carrier - it says
// nothing, it only looks something up; not persistent - a service restart signs
// everybody out; not expiring, not renewable, not revocable in bulk; and not an
// authorization mechanism - only the session endpoints check it, every other
// endpoint on this service is still open. This is a local shop.
public class SessionStore : ISessionStore
{
    private readonly ConcurrentDictionary<string, SessionPrincipal> _sessions = new(StringComparer.Ordinal);

    public string Issue(string kind, string id)
    {
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        _sessions[token] = new SessionPrincipal { Kind = kind, Id = id };
        return token;
    }

    public SessionPrincipal? Resolve(string? token) =>
        string.IsNullOrWhiteSpace(token) ? null : _sessions.TryGetValue(token, out var principal) ? principal : null;

    public bool Revoke(string? token) =>
        !string.IsNullOrWhiteSpace(token) && _sessions.TryRemove(token, out _);
}
