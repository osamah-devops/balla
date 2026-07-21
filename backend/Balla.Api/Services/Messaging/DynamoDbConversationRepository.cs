using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Balla.Api.Models;
using Balla.Api.Options;
using Microsoft.Extensions.Options;

namespace Balla.Api.Services.Messaging;

public class DynamoDbConversationRepository : IConversationRepository
{
    private readonly IDynamoDBContext _context;
    private readonly DynamoDBOperationConfig _config;

    public DynamoDbConversationRepository(IAmazonDynamoDB client, IOptions<AwsResourceOptions> options)
    {
        _context = new DynamoDBContext(client);
        _config = new DynamoDBOperationConfig { OverrideTableName = options.Value.ConversationsTableName };
    }

    public async Task<Conversation> FindOrCreateAsync(
        string buyerId, string buyerName, string? buyerProfileImageUrl,
        string sellerId, string sellerName, string? sellerProfileImageUrl,
        CancellationToken ct)
    {
        var conversationId = BuildConversationId(buyerId, sellerId);
        var existing = await _context.LoadAsync<Conversation?>(conversationId, _config, ct);
        if (existing is not null)
        {
            return existing;
        }

        var conversation = new Conversation
        {
            ConversationId = conversationId,
            BuyerId = buyerId,
            BuyerName = buyerName,
            BuyerProfileImageUrl = buyerProfileImageUrl,
            SellerId = sellerId,
            SellerName = sellerName,
            SellerProfileImageUrl = sellerProfileImageUrl,
            LastMessageAt = DateTime.UtcNow.ToString("O"),
            LastMessagePreview = string.Empty,
        };
        await _context.SaveAsync(conversation, _config, ct);
        return conversation;
    }

    public Task<Conversation?> GetAsync(string conversationId, CancellationToken ct) =>
        _context.LoadAsync<Conversation?>(conversationId, _config, ct);

    public async Task<IReadOnlyList<Conversation>> ListForBuyerAsync(string buyerId, CancellationToken ct)
    {
        var config = new DynamoDBOperationConfig { OverrideTableName = _config.OverrideTableName, IndexName = "buyer-index" };
        var conversations = await _context.QueryAsync<Conversation>(buyerId, config).GetRemainingAsync(ct);
        conversations.Reverse();
        return conversations;
    }

    public async Task<IReadOnlyList<Conversation>> ListForSellerAsync(string sellerId, CancellationToken ct)
    {
        var config = new DynamoDBOperationConfig { OverrideTableName = _config.OverrideTableName, IndexName = "seller-index" };
        var conversations = await _context.QueryAsync<Conversation>(sellerId, config).GetRemainingAsync(ct);
        conversations.Reverse();
        return conversations;
    }

    public Task PutAsync(Conversation conversation, CancellationToken ct) => _context.SaveAsync(conversation, _config, ct);

    // Deterministic id so either participant resolves the same thread without a lookup index.
    private static string BuildConversationId(string buyerId, string sellerId)
    {
        var (first, second) = string.CompareOrdinal(buyerId, sellerId) <= 0 ? (buyerId, sellerId) : (sellerId, buyerId);
        return $"{first}#{second}";
    }
}
