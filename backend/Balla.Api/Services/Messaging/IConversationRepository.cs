using Balla.Api.Models;

namespace Balla.Api.Services.Messaging;

public interface IConversationRepository
{
    Task<Conversation> FindOrCreateAsync(
        string buyerId, string buyerName, string? buyerProfileImageUrl,
        string sellerId, string sellerName, string? sellerProfileImageUrl,
        CancellationToken ct);
    Task<Conversation?> GetAsync(string conversationId, CancellationToken ct);
    /// <summary>Newest first.</summary>
    Task<IReadOnlyList<Conversation>> ListForBuyerAsync(string buyerId, CancellationToken ct);
    /// <summary>Newest first.</summary>
    Task<IReadOnlyList<Conversation>> ListForSellerAsync(string sellerId, CancellationToken ct);
    Task PutAsync(Conversation conversation, CancellationToken ct);
}
