namespace Balla.Api.Contracts.Messaging;

public record ConversationMessageResponse(
    string Id,
    string ConversationId,
    string SenderId,
    string SenderName,
    string Body,
    string? ProductId,
    string? ProductTitle,
    string CreatedAt
);
