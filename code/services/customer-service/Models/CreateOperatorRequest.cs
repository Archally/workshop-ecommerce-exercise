using System.ComponentModel.DataAnnotations;

namespace CustomerService.Models;

/// <summary>Details submitted to add a new operator</summary>
public class CreateOperatorRequest
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

    /// <summary>Password this operator will sign in with. Stored hashed, never in clear</summary>
    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;
}
