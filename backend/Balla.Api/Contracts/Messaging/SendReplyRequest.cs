using System.ComponentModel.DataAnnotations;

namespace Balla.Api.Contracts.Messaging;

public class SendReplyRequest
{
    [Required, MinLength(1), MaxLength(2000)]
    public required string Body { get; set; }
}
