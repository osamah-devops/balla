using Balla.Api.Models;
using Balla.Api.Services.Notifications;

namespace Balla.Api.Services.Messaging;

public class ConversationMessenger(
    IConversationRepository conversationRepository,
    IConversationMessageRepository conversationMessageRepository,
    INotificationDispatcher notificationDispatcher) : IConversationMessenger
{
    public async Task<ConversationMessage> SendAsync(
        Conversation conversation,
        string senderId,
        string senderName,
        string body,
        string? productId,
        string? productTitle,
        string notificationType,
        string notificationText,
        CancellationToken ct)
    {
        var message = new ConversationMessage
        {
            ConversationId = conversation.ConversationId,
            MessageId = $"{DateTime.UtcNow:O}#{Guid.NewGuid():N}",
            SenderId = senderId,
            SenderName = senderName,
            ProductId = productId,
            ProductTitle = productTitle,
            Body = body,
            CreatedAt = DateTime.UtcNow.ToString("O"),
        };
        await conversationMessageRepository.PutAsync(message, ct);

        var isSeller = senderId == conversation.SellerId;
        conversation.LastMessageAt = message.CreatedAt;
        conversation.LastMessagePreview = body;
        conversation.LastProductId = productId ?? conversation.LastProductId;
        conversation.LastProductTitle = productTitle ?? conversation.LastProductTitle;
        if (isSeller)
        {
            conversation.SellerUnreadCount = 0;
            conversation.BuyerUnreadCount++;
        }
        else
        {
            conversation.BuyerUnreadCount = 0;
            conversation.SellerUnreadCount++;
        }
        await conversationRepository.PutAsync(conversation, ct);

        var recipientId = isSeller ? conversation.BuyerId : conversation.SellerId;
        await notificationDispatcher.DispatchAsync(
            recipientId,
            notificationType,
            notificationText,
            conversation.ConversationId,
            productId,
            productTitle,
            ct);

        return message;
    }
}
