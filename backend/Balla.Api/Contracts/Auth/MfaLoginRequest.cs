using System.ComponentModel.DataAnnotations;

namespace Balla.Api.Contracts.Auth;

public class MfaLoginRequest
{
    [Required, EmailAddress]
    public required string Email { get; set; }

    [Required]
    public required string Session { get; set; }

    [Required, MinLength(6), MaxLength(6)]
    public required string Code { get; set; }
}
