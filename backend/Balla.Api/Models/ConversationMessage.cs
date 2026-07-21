using Amazon.DynamoDBv2.DataModel;

namespace Balla.Api.Models;

public class ConversationMessage
{
    [DynamoDBHashKey("ConversationId")]
    public string ConversationId { get; set; } = default!;

    [DynamoDBRangeKey("MessageId")]
    public string MessageId { get; set; } = default!;

    public string SenderId { get; set; } = default!;
    public string SenderName { get; set; } = default!;
    public string Body { get; set; } = default!;
    public string? ProductId { get; set; }
    public string? ProductTitle { get; set; }
    public string CreatedAt { get; set; } = default!;
}
