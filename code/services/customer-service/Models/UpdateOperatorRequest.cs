using System.ComponentModel.DataAnnotations;

namespace CustomerService.Models;

/// <summary>Details submitted to update an operator's profile</summary>
public class UpdateOperatorRequest
{
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
}
