using System.ComponentModel.DataAnnotations;

namespace Balla.Api.Contracts.Messaging;

public class StartConversationRequest
{
    public string? ProductId { get; set; }

    [Required, MinLength(1), MaxLength(2000)]
    public required string Body { get; set; }
}
