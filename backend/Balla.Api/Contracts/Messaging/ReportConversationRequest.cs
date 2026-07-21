using System.ComponentModel.DataAnnotations;

namespace Balla.Api.Contracts.Messaging;

public class ReportConversationRequest
{
    [Required, MinLength(1), MaxLength(1000)]
    public required string Reason { get; set; }
}
