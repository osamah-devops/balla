using System.ComponentModel.DataAnnotations;

namespace Balla.Api.Contracts.Auth;

public class RegisterRequest
{
    [Required, MinLength(2)]
    public required string Name { get; set; }

    [Required, EmailAddress]
    public required string Email { get; set; }

    [Required, MinLength(12)]
    public required string Password { get; set; }

    [Required, RegularExpression(@"^\d{5}(-\d{4})?$")]
    public required string ZipCode { get; set; }

    [Required]
    public required string State { get; set; }

    /// <summary>When set, the account is registered as a seller with this storefront name.</summary>
    [MaxLength(100)]
    public string? StoreName { get; set; }
}
