using System.ComponentModel.DataAnnotations;

namespace Balla.Api.Contracts.Auth;

public class VerifyMfaRequest
{
    [Required, MinLength(6), MaxLength(6)]
    public required string Code { get; set; }
}
