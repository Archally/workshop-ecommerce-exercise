namespace CustomerService.Services;

// Reads the opaque session token off "Authorization: Bearer <token>". Kept in one
// place so both controllers accept exactly the same header spelling.
public static class BearerToken
{
    private const string Prefix = "Bearer ";

    public static string? From(HttpRequest request)
    {
        var header = request.Headers.Authorization.ToString();
        return header.StartsWith(Prefix, StringComparison.OrdinalIgnoreCase)
            ? header[Prefix.Length..].Trim()
            : null;
    }
}
