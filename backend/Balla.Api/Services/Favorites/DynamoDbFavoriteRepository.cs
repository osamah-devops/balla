using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Balla.Api.Models;
using Balla.Api.Options;
using Microsoft.Extensions.Options;

namespace Balla.Api.Services.Favorites;

public class DynamoDbFavoriteRepository : IFavoriteRepository
{
    private readonly IDynamoDBContext _context;
    private readonly DynamoDBOperationConfig _config;

    public DynamoDbFavoriteRepository(IAmazonDynamoDB client, IOptions<AwsResourceOptions> options)
    {
        _context = new DynamoDBContext(client);
        _config = new DynamoDBOperationConfig { OverrideTableName = options.Value.FavoritesTableName };
    }

    public async Task<IReadOnlyList<Favorite>> ListForUserAsync(string userId, CancellationToken ct) =>
        await _context.QueryAsync<Favorite>(userId, _config).GetRemainingAsync(ct);

    public Task AddAsync(string userId, string productId, CancellationToken ct) =>
        _context.SaveAsync(new Favorite { UserId = userId, ProductId = productId, CreatedAt = DateTime.UtcNow.ToString("O") }, _config, ct);

    public Task RemoveAsync(string userId, string productId, CancellationToken ct) =>
        _context.DeleteAsync<Favorite>(userId, productId, _config, ct);
}
