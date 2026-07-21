using Amazon.DynamoDBv2.DataModel;

namespace Balla.Api.Models;

public class Conversation
{
    [DynamoDBHashKey("ConversationId")]
    public string ConversationId { get; set; } = default!;

    public string BuyerId { get; set; } = default!;
    public string BuyerName { get; set; } = default!;
    public string? BuyerProfileImageUrl { get; set; }
    public string SellerId { get; set; } = default!;
    public string SellerName { get; set; } = default!;
    public string? SellerProfileImageUrl { get; set; }
    public string LastMessageAt { get; set; } = default!;
    public string LastMessagePreview { get; set; } = default!;
    public string? LastProductId { get; set; }
    public string? LastProductTitle { get; set; }
    public int BuyerUnreadCount { get; set; }
    public int SellerUnreadCount { get; set; }
}
