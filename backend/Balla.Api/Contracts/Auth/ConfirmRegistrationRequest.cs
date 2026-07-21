using System.ComponentModel.DataAnnotations;

namespace Balla.Api.Contracts.Auth;

public class ConfirmRegistrationRequest
{
    [Required, EmailAddress]
    public required string Email { get; set; }

    [Required]
    public required string Code { get; set; }
}
