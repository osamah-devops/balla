using Balla.Api.Models;

namespace Balla.Api.Services.Messaging;

public interface IConversationMessenger
{
    /// <summary>Appends a message to the conversation, updates its last-message/unread bookkeeping,
    /// and dispatches a notification (live + persisted + offline email) to the other participant.</summary>
    Task<ConversationMessage> SendAsync(
        Conversation conversation,
        string senderId,
        string senderName,
        string body,
        string? productId,
        string? productTitle,
        string notificationType,
        string notificationText,
        CancellationToken ct);
}
