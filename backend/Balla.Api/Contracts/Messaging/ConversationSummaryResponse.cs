namespace Balla.Api.Contracts.Messaging;

public record ConversationSummaryResponse(
    string Id,
    string BuyerId,
    string BuyerName,
    string? BuyerProfileImageUrl,
    string SellerId,
    string SellerName,
    string? SellerProfileImageUrl,
    string LastMessageAt,
    string LastMessagePreview,
    string? LastProductId,
    string? LastProductTitle,
    int UnreadCount
);
