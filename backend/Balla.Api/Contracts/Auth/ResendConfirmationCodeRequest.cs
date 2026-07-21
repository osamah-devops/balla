using System.ComponentModel.DataAnnotations;

namespace Balla.Api.Contracts.Auth;

public class ResendConfirmationCodeRequest
{
    [Required, EmailAddress]
    public required string Email { get; set; }
}
