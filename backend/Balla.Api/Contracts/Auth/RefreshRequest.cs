using System.ComponentModel.DataAnnotations;

namespace Balla.Api.Contracts.Auth;

public class RefreshRequest
{
    [Required]
    public required string RefreshToken { get; set; }
}
