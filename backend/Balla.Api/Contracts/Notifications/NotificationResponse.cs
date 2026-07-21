namespace Balla.Api.Contracts.Notifications;

public record NotificationResponse(
    string Id,
    string Type,
    string? ConversationId,
    string? ProductId,
    string? ProductTitle,
    string Message,
    string CreatedAt,
    bool Read
);
