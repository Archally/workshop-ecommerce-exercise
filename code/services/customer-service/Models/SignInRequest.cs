using System.ComponentModel.DataAnnotations;

namespace CustomerService.Models;

/// <summary>A login and a password offered in exchange for a session token</summary>
public class SignInRequest
{
    /// <summary>The account's login, which is its email address</summary>
    [Required]
    public string Login { get; set; } = string.Empty;

    /// <summary>The account's password</summary>
    [Required]
    public string Password { get; set; } = string.Empty;
}
