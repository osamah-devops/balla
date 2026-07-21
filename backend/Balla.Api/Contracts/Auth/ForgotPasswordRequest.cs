using System.ComponentModel.DataAnnotations;

namespace Balla.Api.Contracts.Auth;

public class ForgotPasswordRequest
{
    [Required, EmailAddress]
    public required string Email { get; set; }
}
