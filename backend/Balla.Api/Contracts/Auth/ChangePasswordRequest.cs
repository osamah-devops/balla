using System.ComponentModel.DataAnnotations;

namespace Balla.Api.Contracts.Auth;

public class ChangePasswordRequest
{
    [Required]
    public required string CurrentPassword { get; set; }

    [Required, MinLength(12)]
    public required string NewPassword { get; set; }
}
