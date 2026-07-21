using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Balla.Api.Models;
using Balla.Api.Options;
using Microsoft.Extensions.Options;

namespace Balla.Api.Services.Users;

public class DynamoDbUserProfileRepository : IUserProfileRepository
{
    private readonly IDynamoDBContext _context;
    private readonly DynamoDBOperationConfig _config;

    public DynamoDbUserProfileRepository(IAmazonDynamoDB client, IOptions<AwsResourceOptions> options)
    {
        _context = new DynamoDBContext(client);
        _config = new DynamoDBOperationConfig { OverrideTableName = options.Value.UsersTableName };
    }

    public Task PutAsync(UserProfile profile, CancellationToken ct) => _context.SaveAsync(profile, _config, ct);

    public Task<UserProfile?> GetAsync(string userId, CancellationToken ct) =>
        _context.LoadAsync<UserProfile?>(userId, _config, ct);
}
