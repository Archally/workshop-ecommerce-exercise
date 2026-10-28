using System.ComponentModel.DataAnnotations;

namespace CustomerService.Models;

/// <summary>
/// Shop operator entity. A back-office identity the UI can display and edit.
/// The operator's email is their login; the password behind it is held hashed by
/// OperatorServiceImplementation and never appears on this record.
/// </summary>
public class Operator
{
    /// <summary>Unique operator identifier</summary>
    [Required]
    public string Id { get; set; } = string.Empty;

    /// <summary>Operator name</summary>
    [Required]
    public string Name { get; set; } = string.Empty;

    /// <summary>Operator email</summary>
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    /// <summary>Operator role in the back office</summary>
    [Required]
    public string Role { get; set; } = string.Empty;

    /// <summary>Whether the operator is currently active</summary>
    [Required]
    public bool IsActive { get; set; } = true;
}
