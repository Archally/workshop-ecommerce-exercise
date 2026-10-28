using CustomerService.Models;

namespace CustomerService.Services;

/// <summary>Operator service implementation with sample data</summary>
public class OperatorServiceImplementation : IOperatorService
{
    private static readonly List<Operator> _operators = new()
    {
        new Operator
        {
            Id = "operator-1",
            Name = "Priya Shah",
            Email = "priya.shah@example.com",
            Role = "store_manager",
            IsActive = true
        },
        new Operator
        {
            Id = "operator-2",
            Name = "Marcus Webb",
            Email = "marcus.webb@example.com",
            Role = "support_agent",
            IsActive = true
        },
        new Operator
        {
            Id = "operator-3",
            Name = "Elena Kowalski",
            Email = "elena.kowalski@example.com",
            Role = "catalog_admin",
            IsActive = false
        },
        // operator-4 added 2026-09-20 for the 22 September local checks
        // (seed data brief): a standing administrator account.
        new Operator
        {
            Id = "operator-4",
            Name = "Nina Osei",
            Email = "nina.osei@example.com",
            Role = "administrator",
            IsActive = true
        }
    };

    // Password hashes, keyed by operator id for the same reason as the customer
    // side. operator-4 (the administrator) is the local operator and is
    // written down in the shop README; the other seeded operators have no
    // password and cannot sign in.
    private static readonly Dictionary<string, string> _operatorPasswords = new(StringComparer.Ordinal)
    {
        ["operator-4"] = PasswordHasher.Hash("operator-demo-2026")
    };

    /// <summary>Get operator by ID</summary>
    public async Task<Operator?> GetOperatorByIdAsync(string operatorId)
    {
        await Task.Delay(10); // Simulate async operation
        return _operators.FirstOrDefault(o => o.Id == operatorId);
    }

    /// <summary>Get all operators</summary>
    public async Task<List<Operator>> GetAllOperatorsAsync()
    {
        await Task.Delay(10); // Simulate async operation
        return _operators.Where(o => o.IsActive).ToList();
    }

    /// <summary>Add a new operator</summary>
    public async Task<Operator> CreateOperatorAsync(CreateOperatorRequest request)
    {
        await Task.Delay(10); // Simulate async operation

        var newOperator = new Operator
        {
            Id = NextOperatorId(),
            Name = request.Name,
            Email = request.Email,
            Role = request.Role,
            IsActive = true
        };

        _operators.Add(newOperator);
        _operatorPasswords[newOperator.Id] = PasswordHasher.Hash(request.Password);

        return newOperator;
    }

    /// <summary>Authenticate an operator by login and password</summary>
    public async Task<Operator?> AuthenticateOperatorAsync(string login, string password)
    {
        await Task.Delay(10); // Simulate async operation

        var matched = _operators.FirstOrDefault(o =>
            o.IsActive && string.Equals(o.Email, login, StringComparison.OrdinalIgnoreCase));

        if (matched == null || !_operatorPasswords.TryGetValue(matched.Id, out var stored))
        {
            return null;
        }

        return PasswordHasher.Verify(password, stored) ? matched : null;
    }

    /// <summary>Update an existing operator's details</summary>
    public async Task<Operator?> UpdateOperatorAsync(string operatorId, UpdateOperatorRequest request)
    {
        await Task.Delay(10); // Simulate async operation

        var existingOperator = _operators.FirstOrDefault(o => o.Id == operatorId);
        if (existingOperator == null)
        {
            return null;
        }

        existingOperator.Name = request.Name;
        existingOperator.Email = request.Email;
        existingOperator.Role = request.Role;

        return existingOperator;
    }

    /// <summary>Delete an operator</summary>
    public async Task<bool> DeleteOperatorAsync(string operatorId)
    {
        await Task.Delay(10); // Simulate async operation

        var existingOperator = _operators.FirstOrDefault(o => o.Id == operatorId);
        if (existingOperator == null)
        {
            return false;
        }

        _operators.Remove(existingOperator);
        _operatorPasswords.Remove(operatorId);

        return true;
    }

    /// <summary>
    /// Next free "operator-N" identifier, continuing the sample data's
    /// numbering scheme rather than switching newly created operators to a
    /// different id shape.
    /// </summary>
    private static string NextOperatorId()
    {
        const string prefix = "operator-";

        var highestIndex = _operators
            .Select(op => op.Id)
            .Where(id => id.StartsWith(prefix, StringComparison.Ordinal))
            .Select(id => int.TryParse(id[prefix.Length..], out var index) ? index : 0)
            .DefaultIfEmpty(0)
            .Max();

        return $"{prefix}{highestIndex + 1}";
    }
}
