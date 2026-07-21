using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Balla.Api.Models;
using Balla.Api.Options;
using Microsoft.Extensions.Options;

namespace Balla.Api.Services.Ratings;

public class DynamoDbRatingRepository : IRatingRepository
{
    private readonly IDynamoDBContext _context;
    private readonly DynamoDBOperationConfig _config;

    public DynamoDbRatingRepository(IAmazonDynamoDB client, IOptions<AwsResourceOptions> options)
    {
        _context = new DynamoDBContext(client);
        _config = new DynamoDBOperationConfig { OverrideTableName = options.Value.RatingsTableName };
    }

    public async Task<IReadOnlyList<Rating>> ListByProductAsync(string productId, CancellationToken ct) =>
        await _context.QueryAsync<Rating>(productId, _config).GetRemainingAsync(ct);

    public Task PutAsync(Rating rating, CancellationToken ct) => _context.SaveAsync(rating, _config, ct);
}
