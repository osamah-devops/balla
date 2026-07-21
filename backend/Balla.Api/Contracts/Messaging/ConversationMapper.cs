using Balla.Api.Models;

namespace Balla.Api.Contracts.Messaging;

public static class ConversationMapper
{
    /// <summary>Unread count reflects whichever side of the conversation <paramref name="currentUserId"/> is on.</summary>
    public static ConversationSummaryResponse ToResponse(this Conversation conversation, string currentUserId) => new(
        conversation.ConversationId,
        conversation.BuyerId, conversation.BuyerName, conversation.BuyerProfileImageUrl,
        conversation.SellerId, conversation.SellerName, conversation.SellerProfileImageUrl,
        conversation.LastMessageAt, conversation.LastMessagePreview, conversation.LastProductId, conversation.LastProductTitle,
        currentUserId == conversation.SellerId ? conversation.SellerUnreadCount : conversation.BuyerUnreadCount
    );

    public static ConversationMessageResponse ToResponse(this ConversationMessage message) => new(
        message.MessageId, message.ConversationId, message.SenderId, message.SenderName,
        message.Body, message.ProductId, message.ProductTitle, message.CreatedAt
    );
}
