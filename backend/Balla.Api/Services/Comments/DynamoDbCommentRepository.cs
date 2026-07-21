using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Balla.Api.Models;
using Balla.Api.Options;
using Microsoft.Extensions.Options;

namespace Balla.Api.Services.Comments;

public class DynamoDbCommentRepository : ICommentRepository
{
    private readonly IDynamoDBContext _context;
    private readonly DynamoDBOperationConfig _config;

    public DynamoDbCommentRepository(IAmazonDynamoDB client, IOptions<AwsResourceOptions> options)
    {
        _context = new DynamoDBContext(client);
        _config = new DynamoDBOperationConfig { OverrideTableName = options.Value.CommentsTableName };
    }

    public async Task<IReadOnlyList<Comment>> ListByProductAsync(string productId, CancellationToken ct) =>
        await _context.QueryAsync<Comment>(productId, _config).GetRemainingAsync(ct);

    public Task PutAsync(Comment comment, CancellationToken ct) => _context.SaveAsync(comment, _config, ct);
}
