using Amazon.DynamoDBv2.DataModel;

namespace Balla.Api.Models;

public class PersistedNotification
{
    [DynamoDBHashKey("RecipientId")]
    public string RecipientId { get; set; } = default!;

    [DynamoDBRangeKey("NotificationId")]
    public string NotificationId { get; set; } = default!;

    public string Type { get; set; } = default!;
    public string? ConversationId { get; set; }
    public string? ProductId { get; set; }
    public string? ProductTitle { get; set; }
    public string Message { get; set; } = default!;
    public string CreatedAt { get; set; } = default!;
    public bool Read { get; set; }

    /// <summary>Unix seconds; DynamoDB TTL prunes notifications automatically after ~90 days.</summary>
    public long ExpiresAt { get; set; }
}
