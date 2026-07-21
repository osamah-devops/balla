using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Balla.Api.Models;
using Balla.Api.Options;
using Microsoft.Extensions.Options;

namespace Balla.Api.Services.Owners;

public class DynamoDbOwnerRepository : IOwnerRepository
{
    private readonly IDynamoDBContext _context;
    private readonly DynamoDBOperationConfig _config;

    public DynamoDbOwnerRepository(IAmazonDynamoDB client, IOptions<AwsResourceOptions> options)
    {
        _context = new DynamoDBContext(client);
        _config = new DynamoDBOperationConfig { OverrideTableName = options.Value.OwnersTableName };
    }

    public async Task<IReadOnlyList<Owner>> ListAsync(CancellationToken ct) =>
        await _context.ScanAsync<Owner>([], _config).GetRemainingAsync(ct);

    public Task<Owner?> GetAsync(string id, CancellationToken ct) => _context.LoadAsync<Owner?>(id, _config, ct);

    public Task PutAsync(Owner owner, CancellationToken ct) => _context.SaveAsync(owner, _config, ct);
}
