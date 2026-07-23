using System.ComponentModel.DataAnnotations;

namespace Balla.Api.Contracts.Admin;

public class UpdateReportStatusRequest
{
    [Required, RegularExpression("^(open|dismissed)$")]
    public required string Status { get; set; }
}
