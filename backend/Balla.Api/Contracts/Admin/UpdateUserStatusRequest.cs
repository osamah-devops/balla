using System.ComponentModel.DataAnnotations;

namespace Balla.Api.Contracts.Admin;

public class UpdateUserStatusRequest
{
    [Required, RegularExpression("^(active|suspended)$")]
    public required string Status { get; set; }
}
