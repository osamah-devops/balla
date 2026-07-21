using System.ComponentModel.DataAnnotations;

namespace Balla.Api.Contracts.Auth;

public class ResetPasswordRequest
{
    [Required, EmailAddress]
    public required string Email { get; set; }

    [Required]
    public required string Code { get; set; }

    [Required, MinLength(12)]
    public required string NewPassword { get; set; }
}
