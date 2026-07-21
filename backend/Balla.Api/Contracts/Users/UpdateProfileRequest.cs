using System.ComponentModel.DataAnnotations;

namespace Balla.Api.Contracts.Users;

public class UpdateProfileRequest
{
    [Required, MinLength(2)]
    public required string Name { get; set; }

    [Required, RegularExpression(@"^\d{5}(-\d{4})?$")]
    public required string ZipCode { get; set; }

    [Required]
    public required string State { get; set; }
}
