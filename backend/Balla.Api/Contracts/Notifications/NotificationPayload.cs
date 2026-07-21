namespace Balla.Api.Contracts.Notifications;

public static class NotificationType
{
    public const string Comment = "comment";
    public const string Rating = "rating";
    public const string Message = "message";
    public const string Offer = "offer";
    public const string Order = "order";
}

public record NotificationPayload(
    string Id,
    string Type,
    string RecipientId,
    string? ConversationId,
    string? ProductId,
    string? ProductTitle,
    string Message,
    string CreatedAt,
    bool Read
);
