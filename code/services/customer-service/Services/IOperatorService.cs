using CustomerService.Models;

namespace CustomerService.Services;

/// <summary>Interface for operator service operations</summary>
public interface IOperatorService
{
    /// <summary>Get operator by ID</summary>
    /// <param name="operatorId">Operator identifier</param>
    /// <returns>Operator if found, null otherwise</returns>
    Task<Operator?> GetOperatorByIdAsync(string operatorId);

    /// <summary>Get all operators</summary>
    /// <returns>List of all operators</returns>
    Task<List<Operator>> GetAllOperatorsAsync();

    /// <summary>Authenticate an operator by login and password</summary>
    /// <param name="login">The operator's login, which is their email address</param>
    /// <param name="password">The operator's password</param>
    /// <returns>The operator if the pair matches an active account, null otherwise</returns>
    Task<Operator?> AuthenticateOperatorAsync(string login, string password);

    /// <summary>Add a new operator</summary>
    /// <param name="request">New operator details</param>
    /// <returns>The created operator</returns>
    Task<Operator> CreateOperatorAsync(CreateOperatorRequest request);

    /// <summary>Update an existing operator's details</summary>
    /// <param name="operatorId">Operator identifier</param>
    /// <param name="request">Updated operator details</param>
    /// <returns>The updated operator if found, null otherwise</returns>
    Task<Operator?> UpdateOperatorAsync(string operatorId, UpdateOperatorRequest request);

    /// <summary>Delete an operator</summary>
    /// <param name="operatorId">Operator identifier</param>
    /// <returns>True if the operator was found and deleted, false otherwise</returns>
    Task<bool> DeleteOperatorAsync(string operatorId);
}
